import React from "react";

interface Image {
  _id: string;
  href: string;
  dimensions: {
    w: number;
    h: number;
  };
}
export interface JustifiedGridProps {
  images: Image[];
  minRowHeightPx?: number;
  maxRowHeightPx?: number;
  spaceBetweenPx?: number;
  style?: React.CSSProperties;
}
export function JustifiedGrid({
  images,
  minRowHeightPx = 150,
  maxRowHeightPx = 400,
  spaceBetweenPx = 5,
  style,
}: JustifiedGridProps) {
  const containerRef = React.useRef<HTMLUListElement>(null);
  const [layout, setLayout] = React.useState<
    ReturnType<typeof createMasonryLayout>
  >([[]]);
  React.useEffect(() => {
    const resizeObserver = new ResizeObserver(
      debounce(() => {
        if (!containerRef.current) return;
        const computedStyle = getComputedStyle(containerRef.current);
        const newLayout = createMasonryLayout({
          images,
          minHeight: minRowHeightPx,
          maxHeight: maxRowHeightPx,
          spaceBetween: spaceBetweenPx,
          // For some reason the ref isn't narrowing
          containerWidth:
            (containerRef.current?.offsetWidth as number) -
            parseInt(computedStyle.paddingInline),
        });
        setLayout(newLayout);
      })
    );
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [images, minRowHeightPx, maxRowHeightPx]);
  return (
    <ul ref={containerRef} style={style}>
      {layout.map((row, i, arr) => (
        <li
          key={row.map((r) => r._id).join("-")}
          style={{
            display: "flex",
            gap: spaceBetweenPx,
            marginBottom: i === arr.length - 1 ? 0 : spaceBetweenPx,
          }}
        >
          {row.map((r) => (
            <img
              key={r._id}
              src={r.href}
              height={r.dimensions.h}
              width={r.dimensions.w}
              loading="lazy"
              style={{
                display: "flex",
                width: r.dimensions.w,
                height: r.dimensions.h,
              }}
            />
          ))}
        </li>
      ))}
    </ul>
  );
}
interface Image {
  _id: string;
  href: string;
  dimensions: {
    w: number;
    h: number;
  };
}
interface CreateMasonryLayoutConfig {
  minHeight: number;
  maxHeight: number;
  containerWidth: number;
  images: Image[];
  spaceBetween: number;
}
interface PendingRow {
  value: Image[];
  width: number;
  aspectRatio: number;
}
function createMasonryLayout({
  images,
  containerWidth,
  maxHeight,
  minHeight,
  spaceBetween,
}: CreateMasonryLayoutConfig): Image[][] {
  if (containerWidth <= 0) {
    console.error("MasonryLayout container must have positive width");
    return [];
  }
  const fullRows: Image[][] = [];
  let currentRow: PendingRow = { value: [], width: 0, aspectRatio: 0 };
  for (const image of images) {
    const { width, height } = calculateDimensions(image, minHeight, maxHeight);
    if (
      currentRow.width + width + spaceBetween > containerWidth &&
      currentRow.value.length > 0
    ) {
      fullRows.push(
        finalizeRow(currentRow, containerWidth, maxHeight, spaceBetween)
      );
      currentRow = { value: [], width: 0, aspectRatio: 0 };
    }
    currentRow.value.push(image);
    currentRow.width +=
      width + (currentRow.value.length > 1 ? spaceBetween : 0);
    currentRow.aspectRatio += width / height;
  }
  if (currentRow.value.length > 0) {
    fullRows.push(
      finalizeRow(currentRow, containerWidth, maxHeight, spaceBetween)
    );
  }
  return fullRows;
}
function calculateDimensions(
  image: Image,
  minHeight: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = image.dimensions.w / image.dimensions.h;
  const height = Math.min(Math.max(minHeight, image.dimensions.h), maxHeight);
  const width = Math.floor(height * aspectRatio);
  return { width, height };
}
function finalizeRow(
  row: PendingRow,
  containerWidth: number,
  maxHeight: number,
  spaceBetween: number
): Image[] {
  const rowWidth = containerWidth - (row.value.length - 1) * spaceBetween;
  const scaleFactor = rowWidth / row.width;
  return row.value.map((image) => {
    const { width, height } = calculateDimensions(image, 0, maxHeight);
    return {
      ...image,
      dimensions: {
        w: Math.floor(width * scaleFactor),
        h: Math.floor(height * scaleFactor),
      },
    };
  });
}
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};
