import type { TextConfig } from "@/types/widget";

type Props = {
  config: TextConfig;
};

export default function TextWidget({ config }: Props) {
  return (
    <div
      className="widget-text"
      style={config.fontSize ? { fontSize: config.fontSize } : undefined}
    >
      {config.content || <em className="widget-text__empty">No text configured</em>}
    </div>
  );
}
