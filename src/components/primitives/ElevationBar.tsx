/**
 * Bands from the elevation ramp. The count encodes depth of ownership
 * or complexity — it is always carrying a value, never decorating.
 */
export function ElevationBar({
  depth,
  orientation = "vertical",
  className,
}: {
  depth: 0 | 1 | 2 | 3 | 4;
  orientation?: "vertical" | "horizontal";
  className?: string;
}) {
  const bands = Array.from({ length: depth + 1 }, (_, i) => `var(--el-${i})`);

  return (
    <span
      className={className}
      style={{
        display: "flex",
        flexDirection: orientation === "vertical" ? "column" : "row",
        gap: "2px",
        width: orientation === "vertical" ? "20px" : "100%",
        height: orientation === "vertical" ? "40px" : "6px",
      }}
      aria-hidden="true"
    >
      {bands.map((c, i) => (
        <span key={i} style={{ flex: 1, background: c, display: "block" }} />
      ))}
    </span>
  );
}
