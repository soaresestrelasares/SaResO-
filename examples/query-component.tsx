import { useQuery } from "@tanstack/react-query";

// Move shared response types and API helpers to src/lib/api-types.ts and src/lib/api.ts.
interface ExampleRecord {
  id: number;
  name: string;
}

const exampleRecordKeys = {
  all: ["example-records"] as const,
};

async function listExampleRecords(): Promise<ExampleRecord[]> {
  const response = await fetch("/api/example-records");

  if (!response.ok) {
    throw new Error("Unable to load example records.");
  }

  const payload = (await response.json()) as { records: ExampleRecord[] };
  return payload.records;
}

export function ExampleRecordsPanel() {
  const recordsQuery = useQuery({
    queryKey: exampleRecordKeys.all,
    queryFn: listExampleRecords,
  });

  if (recordsQuery.isPending) return <p>Loading...</p>;
  if (recordsQuery.isError) return <p>{recordsQuery.error.message}</p>;

  return (
    <ul>
      {recordsQuery.data.map((record) => (
        <li key={record.id}>{record.name}</li>
      ))}
    </ul>
  );
}
