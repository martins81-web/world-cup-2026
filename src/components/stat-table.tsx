import { notAvailable } from "@/lib/ui";

export function StatTable({ rows }: { rows: Array<Record<string, string | number | null | undefined>> }) {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  if (rows.length === 0) return <p>Not available</p>;
  return (
    <div className="overflow-hidden rounded-md border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-black/5 text-left">
          <tr>{headers.map((header) => <th className="p-3" key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr className="border-t" key={index}>
              {headers.map((header) => <td className="p-3" key={header}>{notAvailable(row[header])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
