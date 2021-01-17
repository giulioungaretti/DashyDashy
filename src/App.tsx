import { Dispatch, SetStateAction, useState } from "react";
import "./App.css";

import { parse } from "papaparse";
import { pipe } from "fp-ts/lib/function";
import { getOrElse, isSome, none, Option, some } from "fp-ts/lib/Option";
import { option } from "fp-ts";
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts";
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
  x: string;
  y: string;
}

const RenderLineChart = ({ data, x, y }: DataProps) => (
  <LineChart width={600} height={500} data={data}>
    <XAxis dataKey={x} />
    <YAxis />
    <Line type="monotone" dataKey={y} stroke="#8884d8" />
  </LineChart>
);

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

const RenderLineChartPlotly = ({ data, x, y }: DataProps) => {
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
      layout={{ title: "A Fancy Plot" }}
    />
  );
};

const ParseData = (data: Option<DynamicData[]>) => {
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
            {headers.map((value) => {
              return <option value={value}>{value}</option>;
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
            {headers.map((value) => {
              return <option value={value}>{value}</option>;
            })}
          </select>
        </div>
        <div id="plot">
          {isSome(x) && isSome(y) && (
            <RenderLineChart data={data.value} x={x.value} y={y.value} />
          )}
        </div>
        <div id="plot2">
          {isSome(x) && isSome(y) && (
            <RenderLineChartPlotly data={data.value} x={x.value} y={y.value} />
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
  return (
    <div className="App">
      <input
        type="file"
        name="upload-file"
        id="upload_file"
        accept=".csv"
        onChange={(e) => fileHandle(e, setError, setData)}
      />
      <button>close</button>
      <ParseData {...data}></ParseData>
      {isSome(error) && <div> {error} </div>}
    </div>
  );
}

export default App;
