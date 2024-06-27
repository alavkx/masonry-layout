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
interface CreateMasonryLayoutConfig {
  minHeight: number;
  maxHeight: number;
  containerWidth: number;
  images: Image[];
  spaceBetween: number;
}
interface PendingRow {
  value: Image[];
  bounds: { lower: number; upper: number };
}
function createMasonryLayout({
  images,
  containerWidth,
  maxHeight,
  minHeight,
  spaceBetween,
}: CreateMasonryLayoutConfig) {
  if (containerWidth === 0) {
    console.error("JustifiedGrid container must have width");
    return [[]];
  }

  let fullRows: Image[][] = [];
  let partialRows: PendingRow[] = [];
  try {
    for (let i = 0; i < images.length; i++) {
      let imageFitInRow = false;
      const image = images[i];
      const { lower, upper } = calculateBounds({ image, minHeight, maxHeight });
      let j = 0;
      while (j < partialRows.length && !imageFitInRow) {
        const row = partialRows[j];
        const allowedWidth =
          containerWidth - (row.value.length - 1) * spaceBetween;
        if (row.bounds.upper >= allowedWidth) {
          console.log(`Row ${fullRows.length} finalized`);
          fullRows.push(
            finalizeRow({ maxHeight, containerWidth, row, spaceBetween })
          );
          partialRows.splice(j, 1);
        } else {
          j++;
        }
        if (
          containerWidth - (row.value.length - 1) * spaceBetween >=
          lower + row.bounds.lower
        ) {
          console.log(`Image ${i} appended to partial row ${j}`);
          row.value.push(image);
          row.bounds.lower += lower;
          row.bounds.upper += upper;
          imageFitInRow = true;
        }
      }
      if (!imageFitInRow) {
        console.log(`Partial row ${partialRows.length} created`);
        partialRows.push({ bounds: { lower, upper }, value: [image] });
      }
    }
    console.log(`${partialRows.length} Partial rows remain`);
    // Slam in any un-finished rows
    for (let i = 0; i < partialRows.length; i++) {
      const row = partialRows[i];
      console.log(
        `Partial row converted to finalized row ${fullRows.length}`,
        row
      );
      fullRows.push(
        finalizeRow({ maxHeight, containerWidth, row, spaceBetween })
      );
    }
  } catch (e) {
    console.error(e);
    console.warn({ fullRows, partialRows });
  }
  return fullRows;
}
function finalizeRow({
  maxHeight,
  containerWidth,
  row,
  spaceBetween,
}: {
  maxHeight: number;
  containerWidth: number;
  row: PendingRow;
  spaceBetween: number;
}) {
  const allowedWidth = containerWidth - (row.value.length - 1) * spaceBetween;
  const finalHeight = (maxHeight * allowedWidth) / row.bounds.upper;
  return row.value.map((r) => ({
    ...r,
    dimensions: {
      w: Math.floor((r.dimensions.w * finalHeight) / r.dimensions.h),
      h: Math.floor(finalHeight),
    },
  }));
}
function calculateBounds({
  image,
  minHeight,
  maxHeight,
}: {
  image: Image;
  minHeight: number;
  maxHeight: number;
}) {
  const aspectRatio = image.dimensions.w / image.dimensions.h;
  return {
    lower: Math.floor(minHeight * aspectRatio),
    upper: Math.ceil(maxHeight * aspectRatio),
  };
}
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};
