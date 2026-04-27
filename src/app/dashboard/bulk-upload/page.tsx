"use client";

import { DragEvent, useMemo, useState } from "react";
import { FiDownload, FiFileText, FiInfo, FiUploadCloud } from "react-icons/fi";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth";

export default function BulkUploadPage() {
  const { token } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? `${apiUrl}/graphql`;
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const requiredColumns = useMemo(
    () => ["name", "description", "price", "stock", "category", "imageUrl", "rating"],
    []
  );

  const callGraphql = async (query: string, variables: Record<string, unknown>) => {
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ query, variables })
    });

    const json = (await response.json()) as { data?: Record<string, unknown>; errors?: Array<{ message: string }> };
    if (json.errors?.length) throw new Error(json.errors[0].message);
    return json.data;
  };

  const parseCsvProducts = (content: string) => {
    const rows = content.split(/\r?\n/).filter(Boolean);
    if (rows.length < 2) return [];
    const header = rows[0].split(",").map((h) => h.trim());
    const idx = (name: string) => header.indexOf(name);

    return rows.slice(1).map((row) => {
      const cols = row.split(",");
      return {
        name: cols[idx("name")]?.trim() ?? "",
        description: cols[idx("description")]?.trim() ?? "",
        category: cols[idx("category")]?.trim() ?? "electronics",
        price: Number(cols[idx("price")]?.trim() ?? 0),
        stock: Number(cols[idx("stock")]?.trim() ?? 0),
        imageUrl: cols[idx("imageUrl")]?.trim() ?? "",
        rating: Number(cols[idx("rating")]?.trim() ?? 0)
      };
    });
  };

  const onFilePick = async (file: File) => {
    setLoading(true);
    setMessage("");
    try {
      const text = await file.text();
      const inputs = parseCsvProducts(text).filter((p) => p.name && p.description);
      if (!inputs.length) throw new Error("No valid product rows in CSV.");

      await callGraphql(
        `mutation CreateProducts($inputs: [CreateProductInput!]!, $authorization: String!) {
          createProducts(inputs: $inputs, authorization: $authorization) { id name }
        }`,
        { inputs, authorization: `Bearer ${token ?? ""}` }
      );

      setMessage(`Upload complete. ${inputs.length} products imported.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void onFilePick(file);
  };

  const downloadTemplate = () => {
    const template = `${requiredColumns.join(",")}\nSample Product,High quality sample description,99.99,10,electronics,https://example.com/image.jpg,4.5\n`;
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products-template.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminShell title="Bulk Upload">
      <section className="space-y-6">
        <article className="surface-card p-6">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
            <FiInfo className="h-4 w-4 text-amber-500" />
            File Requirements
          </h2>
          <p className="mt-2 text-sm text-slate-600">Upload a CSV file with these columns:</p>

          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {requiredColumns.join(", ")}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-800">Staff Rows (Example Format)</p>
              <p className="mt-1 text-xs text-slate-600">Set product fields exactly as header: `name`, `description`, `price`, `stock`, `category`, `imageUrl`, `rating`.</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-sm font-medium text-slate-800">Validation Rules</p>
              <p className="mt-1 text-xs text-slate-600">`name` and `description` required. Numeric fields should be valid numbers.</p>
            </div>
          </div>

          <button onClick={downloadTemplate} className="btn-secondary mt-4 text-sm">
            <FiDownload className="h-4 w-4" />
            Download Template
          </button>
        </article>

        <article
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`surface-card border-2 border-dashed p-8 text-center transition ${
            isDragging ? "border-blue-400 bg-blue-50/70" : "border-slate-300"
          }`}
        >
          <FiUploadCloud className="mx-auto h-10 w-10 text-slate-500" />
          <p className="mt-3 text-sm font-medium text-slate-800">Drop your file here, or click to browse</p>
          <p className="mt-1 text-xs text-slate-500">Accepts .csv only</p>

          <label className="btn-primary mx-auto mt-5 inline-flex cursor-pointer text-sm">
            <FiFileText className="h-4 w-4" />
            Choose CSV File
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFilePick(file);
              }}
            />
          </label>

          {message && (
            <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">{loading ? "Uploading..." : message}</p>
          )}
        </article>
      </section>
    </AdminShell>
  );
}

