import os
import sys
import time
import subprocess
import socket
from playwright.sync_api import sync_playwright

def kill_process_on_port(port):
    """强制清理占用指定端口的僵尸进程"""
    print(f"[*] 检查并清理占用端口 {port} 的进程...")
    try:
        # 使用 lsof 查找占用端口的 PID 并 kill
        subprocess.run(f"kill -9 $(lsof -t -i:{port}) 2>/dev/null", shell=True)
        time.sleep(1) # 等待进程完全退出
    except Exception:
        pass

def clean_next_cache():
    """清理 Next.js 的 .next 缓存目录，防止构建锁死"""
    print("[*] 检查并清理 .next 缓存 (防锁)...")
    try:
        subprocess.run("rm -rf .next/dev", shell=True)
    except Exception:
        pass

def wait_for_port(port, timeout=120):
    """等待指定端口服务启动，Next.js 初次编译可能较慢，增加超时时间"""
    print(f"[*] 等待本地服务就绪 (监听 {port} 端口, 超时 {timeout}s)...")
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.create_connection(('127.0.0.1', port), timeout=1):
                # 即使端口通了，Next.js 可能还在编译 initial page
                # 额外等待几秒钟确保 HTTP 服务能够响应
                time.sleep(5)
                return True
        except OSError:
            time.sleep(2)
    return False

def verify_ui(url="http://localhost:3005", output_image="ui_screenshot.png", output_logs="ui_logs.txt"):
    """
    清理环境 -> 启动服务 -> 访问页面并长超时等待按需编译 -> 截图与日志收集
    """
    print(f"[*] 准备启动 Playwright 验证: {url}")

    # 1. 环境清理：杀掉残留的 Node 进程，清理可能锁死的 Next 缓存
    kill_process_on_port(3005)
    clean_next_cache()

    # 2. 启动 Next.js 本地开发服务器
    print("[*] 正在启动 Next.js 服务 (npm run dev)...")
    server_process = subprocess.Popen(
        ["npm", "run", "dev", "--", "-p", "3005"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    if not wait_for_port(3005, timeout=120):
        print("[!] 错误: 等待 Next.js 服务启动超时 (120秒)。请检查终端日志。")
        server_process.terminate()
        sys.exit(1)

    print("[*] 服务已启动，开始浏览器自动化流程...")
    logs = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            page.on("console", lambda msg: logs.append(f"[{msg.type}] {msg.text}"))
            page.on("pageerror", lambda exc: logs.append(f"[ERROR] {exc}"))

            print(f"[*] 正在导航至 {url} (等待 Next.js 首次编译, 超时 90s)...")
            # 增加导航超时时间到 90000 毫秒，应对 Next.js 复杂的首次按需编译
            page.goto(url, wait_until="domcontentloaded", timeout=90000)

            # 额外等待 5 秒，确保复杂图表、Prisma 数据获取和 hydration 动画完全结束
            page.wait_for_timeout(5000)

            print(f"[*] 正在截取页面快照并保存至 {output_image} ...")
            page.screenshot(path=output_image, full_page=True)

            browser.close()

    except Exception as e:
        print(f"[!] 自动化执行出错: {str(e)}")
        logs.append(f"[SYSTEM_ERROR] Playwright 脚本抛出异常: {str(e)}")
    finally:
        print("[*] 正在关闭 Next.js 服务...")
        server_process.terminate()
        try:
            server_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server_process.kill()

        # 再次确保端口被释放
        kill_process_on_port(3005)

    print(f"[*] 正在将控制台日志保存至 {output_logs} ...")
    with open(output_logs, "w", encoding="utf-8") as f:
        if not logs:
            f.write("没有检测到前端控制台输出或错误。\n")
        else:
            f.write("\n".join(logs) + "\n")

    print("\n[+] 验证脚本执行完毕！")
    print(f"   📸 截图已保存: {output_image}")
    print(f"   📝 日志已保存: {output_logs}")

if __name__ == "__main__":
    target_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3005"
    verify_ui(url=target_url)