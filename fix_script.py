import subprocess
import time

def kill_port(port):
    try:
        subprocess.run(f"kill -9 $(lsof -t -i:{port}) 2>/dev/null", shell=True)
    except:
        pass

kill_port(3000)
kill_port(3003)
subprocess.run("rm -rf .next", shell=True)

# Start dev server in background
process = subprocess.Popen(["npm", "run", "dev"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
time.sleep(10) # wait for startup

with open("next_server_output.log", "w") as f:
    f.write("Server started...")
