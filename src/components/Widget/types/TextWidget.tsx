import type { TextConfig } from "@/types/widget";

type Props = {
  config: TextConfig;
};

export default function TextWidget({ config }: Props) {
  const text = config.content;
  return (
    <div
      className="w-full h-full d-flex align-center justify-center text-center"
      style={{
        padding: '0.75rem',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        boxSizing: 'border-box',
        lineHeight: 1.5,
        ...(config.fontSize ? { fontSize: config.fontSize } : {}),
        ...(!text ? { opacity: 0.4, fontStyle: 'italic' } : {}),
      }}
    >
      {text || <em>No text configured</em>}
    </div>
  );
}
