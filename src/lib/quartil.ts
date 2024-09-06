import clone from "lodash.clonedeep";

export function calculateQuartiles(data: any): Array<any> {
  const values = data
    .filter((e: any) => e !== undefined)
    .sort((a: number, b: number) => a - b);

  let q1: number;
  let q2: number;
  let q3: number;
  let q4: number;

  q1 = values[Math.round(0.25 * (values.length + 1)) - 1];

  if (values.length % 2 === 0) {
    q2 = (values[values.length / 2 - 1] + values[values.length / 2]) / 2;
  } else {
    q2 = values[(values.length + 1) / 2];
  }

  q3 = values[Math.round(0.75 * (values.length + 1)) - 1];
  q4 = values[values.length - 1];

  const tmp = {
    q1: new Array<number>(),
    q2: new Array<number>(),
    q3: new Array<number>(),
    q4: new Array<number>(),
  };

  let q: string;
  for (const v of values || []) {
    if (v <= q1) {
      q = "q1";
    } else {
      if (v <= q2) {
        q = "q2";
      } else {
        if (v <= q3) {
          q = "q3";
        } else {
          q = "q4";
        }
      }
    }

    tmp[q].push(v);
  }

  const final = new Array<any>();

  for (const k in tmp) {
    if (k) {
      const v = tmp[k];
      const sum = v.length;
      if (sum > 0) {
        const test = {
          tot: sum,
          por: Math.round((sum * 100) / values.length),
          int: {
            lower: v[0],
            upper: v[sum - 1],
          },
        };

        final.push(clone(test));
      }
    }
  }

  return final;
}
