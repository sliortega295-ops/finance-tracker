"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { importTransactions } from "@/lib/actions/transaction";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ParsedRow {
  date: string;
  type: string;
  categoryName: string;
  amount: number;
  description?: string;
}

export function ImportTransactionsDialog() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [pending, setPending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");
    setPreview([]);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const rows: ParsedRow[] = [];
        for (const raw of results.data) {
          // 支持英文列名（导出格式）和中文列名两种
          const date = (raw["Date"] || raw["日期"] || "").trim();
          const type = (raw["Type"] || raw["类型"] || "").trim().toUpperCase();
          const categoryName = (raw["Category"] || raw["分类"] || "").trim();
          const amountStr = (raw["Amount"] || raw["金额"] || "").trim();
          const description = (raw["Description"] || raw["备注"] || "").trim() || undefined;

          if (!date || !type || !categoryName || !amountStr) continue;

          const amount = parseFloat(amountStr);
          if (isNaN(amount) || amount <= 0) continue;

          rows.push({ date, type, categoryName, amount, description });
        }

        if (rows.length === 0) {
          setParseError("未识别到有效数据，请确认 CSV 格式符合模板（包含 Date/Type/Category/Amount 列）");
          return;
        }
        setPreview(rows);
      },
      error(err) {
        setParseError(`文件解析失败：${err.message}`);
      },
    });
  }

  async function handleImport() {
    if (preview.length === 0) return;
    setPending(true);
    try {
      const result = await importTransactions(preview);
      if (result.imported > 0) {
        toast.success(`成功导入 ${result.imported} 条记录`);
      }
      if (result.errors.length > 0) {
        // 只显示前 3 条错误，避免 toast 堆叠
        result.errors.slice(0, 3).forEach((e) => toast.error(e));
        if (result.errors.length > 3) {
          toast.error(`还有 ${result.errors.length - 3} 条错误未显示`);
        }
      }
      if (result.imported > 0) {
        setOpen(false);
        setPreview([]);
        router.refresh();
      }
    } catch {
      toast.error("导入失败，请重试");
    } finally {
      setPending(false);
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      setPreview([]);
      setParseError("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-1" />
          批量导入
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>批量导入收支记录</DialogTitle>
          <DialogDescription>
            上传 CSV 文件，需包含列：<code className="bg-gray-100 px-1 rounded text-xs">Date、Type、Category、Amount</code>（可选 Description）。
            可从「个人中心」先导出一份作为模板参考。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* 文件选择 */}
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">点击选择 CSV 文件</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {/* 解析错误 */}
          {parseError && (
            <p className="text-sm text-red-500 bg-red-50 rounded p-2">{parseError}</p>
          )}

          {/* 预览表格 */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                识别到 <strong>{preview.length}</strong> 条记录（预览前 5 条）：
              </p>
              <div className="overflow-x-auto rounded border text-xs">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {["日期", "类型", "分类", "金额", "备注"].map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left text-gray-500 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1.5">{row.date}</td>
                        <td className="px-2 py-1.5">
                          <span
                            className={
                              row.type === "INCOME"
                                ? "text-green-600"
                                : "text-red-500"
                            }
                          >
                            {row.type === "INCOME" ? "收入" : "支出"}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">{row.categoryName}</td>
                        <td className="px-2 py-1.5">¥{row.amount.toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-gray-400">
                          {row.description || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length > 5 && (
                <p className="text-xs text-gray-400">…共 {preview.length} 条，仅预览前 5 条</p>
              )}
            </div>
          )}

          {/* 导入按钮 */}
          <Button
            className="w-full"
            disabled={preview.length === 0 || pending}
            onClick={handleImport}
          >
            {pending
              ? "导入中…"
              : preview.length > 0
              ? `确认导入 ${preview.length} 条记录`
              : "请先选择文件"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
