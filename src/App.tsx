import { Dispatch, SetStateAction, useRef, useState } from "react";
import "./App.css";

import { parse } from "papaparse";
import { pipe } from "fp-ts/lib/function";
import { getOrElse, isSome, none, Option, some } from "fp-ts/lib/Option";
import { option } from "fp-ts";
import Plot from "react-plotly.js";
import { Datum } from "plotly.js";

interface DynamicData {
  [key: string]: any;
}
function fileHandle(
  e: React.ChangeEvent<HTMLInputElement>,
  setError: Dispatch<SetStateAction<Option<string>>>,
  setData: Dispatch<SetStateAction<Option<DynamicData[]>>>
) {
  let reader = new FileReader();
  let files = option.fromNullable(e.target.files);
  pipe(
    files,
    option.map((files: FileList) => {
      if (files.length !== 1) {
        setError(some("shit"));
      } else {
        reader.onload = (_event: Event) => {
          const data = parse<DynamicData>(reader.result as string, {
            encoding: "UTF-8",
            error: (e) => setError(some(e.message)),
            header: true,
          });
          setData(some(data.data));
        };
        reader.readAsText(files[0], "UTF-8");
      }
      return files;
    })
  );
}

interface DataProps {
  data: DynamicData[];
  onClick: Dispatch<SetStateAction<Option<string[]>>>;
  x: string;
  y: string;
}

interface DataPropsPlotly {
  x: Datum[];
  y: Datum[];
}

const reshuffleData = (
  data: DynamicData[],
  xLabel: string,
  yLabel: string
): DataPropsPlotly => {
  let x: Datum[] = [];
  let y: Datum[] = [];
  data.forEach((row) => {
    x.push(row[xLabel]!);
    y.push(row[yLabel]!);
  });
  return {
    x: x,
    y: y,
  };
};

const lookup = (index: number, data: DataPropsPlotly): string[] => {
  return [
    index.toString(),
    data.x[index]?.toString() ?? "baddata",
    data.y[index]?.toString() ?? "bad data",
  ];
};
const RenderLineChartPlotly = ({ data, x, y, onClick }: DataProps) => {
  let plotlydata = reshuffleData(data, x, y);
  return (
    <Plot
      data={[
        {
          x: plotlydata.x,
          y: plotlydata.y,
          type: "scatter",
          mode: "lines+markers",
          marker: { color: "red" },
        },
      ]}
      layout={{ title: "Click a point to see the raw data" }}
      onClick={(event) =>
        onClick(some(lookup(event.points[0]?.pointIndex, plotlydata)))
      }
    />
  );
};

const ParseData = ({
  data,
  onClick,
}: {
  data: Option<DynamicData[]>;
  onClick: Dispatch<SetStateAction<Option<string[]>>>;
}) => {
  console.log("p1");
  console.log(data);
  let [x, setX] = useState<Option<string>>(none);
  let [y, setY] = useState<Option<string>>(none);
  if (isSome(data)) {
    // 1st row
    const headers = Object.keys(data.value[0]);
    // actual data
    // console.log(restOfData);
    return (
      <>
        <div id="x">
          <label>x</label>
          <select
            value={getOrElse(() => "")(x)}
            onChange={(e) => setX(some(e.target.value))}
          >
            <option hidden value="">
              placeholder
            </option>
            {headers.map((value, index) => {
              return (
                <option value={value} key={index}>
                  {value}
                </option>
              );
            })}
          </select>
        </div>
        <div id="x">
          <label>y</label>
          <select
            value={getOrElse(() => "None")(y)}
            onChange={(e) => setY(some(e.target.value))}
          >
            <option hidden value="">
              placeholder
            </option>
            {headers.map((value, index) => {
              return (
                <option value={value} key={index}>
                  {value}
                </option>
              );
            })}
          </select>
        </div>
        <div id="plot2">
          {isSome(x) && isSome(y) && (
            <RenderLineChartPlotly
              data={data.value}
              x={x.value}
              y={y.value}
              onClick={onClick}
            />
          )}
        </div>
      </>
    );
    // );
    // return <MarseData data={data.value} />;
  } else {
    return null;
  }
};

function App() {
  let [error, setError] = useState<Option<string>>(none);
  let [data, setData] = useState<Option<DynamicData[]>>(none);
  let [img, setImg] = useState<Option<string[]>>(none);
  let ref = useRef<HTMLInputElement>(null);
  const clearAll = () => {
    if (ref && ref.current?.value && ref.current?.value && true) {
      ref.current.value = "";
    }
    setData(none);
  };

  return (
    <div className="App">
      <input
        type="file"
        name="upload-file"
        id="upload_file"
        accept=".csv"
        ref={ref}
        onChange={(e) => fileHandle(e, setError, setData)}
      />
      <button onClick={(_) => clearAll()}>close data file</button>
      <ParseData data={data} onClick={setImg}></ParseData>
      {isSome(error) && <div> {error} </div>}
      {isSome(img) && (
        <div>
          <text>
            viewing image for point no {img.value[0]} @ x:{img.value[1]},y:
            {img.value[2]}{" "}
          </text>
          <img
            src={`https://picsum.photos/200/?random=${img.value[0]}`}
            alt={img.value.toString()}
          ></img>
          <button onClick={(_) => setImg(none)}>close data viewer</button>
        </div>
      )}
    </div>
  );
}

export default App;
