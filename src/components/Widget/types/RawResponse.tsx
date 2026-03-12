type Props = {
  data: unknown;
};

export default function RawResponse({ data }: Props) {
  return (
    <pre className="widget-raw">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
