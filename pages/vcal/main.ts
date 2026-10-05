import "./style.css";
import Alpine from "alpinejs";

import { type UrlParams, urlParams } from "../_utils/alpine-url-params";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const today = new Date();

const canShareFile =
  typeof navigator !== "undefined" &&
  typeof navigator.share !== "undefined" &&
  !!navigator.canShare?.({ files: [new File([], "test.png", { type: "image/png" })] });

function root() {
  return {
    snapdom: undefined as any,

    weekdays,
    months,

    activeDates: [] as number[],
    monthIdx: today.getMonth(),
    year: today.getFullYear(),
    weekMap: {} as { [key: string]: (number | null)[] },
    columnCount: 0,

    get self() {
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      type ReAlpine = Alpine.XDataContext &
        Alpine.Magics<{}> & { $store: { urlParams: UrlParams } };
      return this as unknown as ReAlpine;
    },

    getParsedParams() {
      const params = this.self.$store.urlParams.params;

      const monthIdxVal = params.month || String(today.getMonth() + 1);
      const yearVal = params.year || String(today.getFullYear());

      const monthIdx = parseInt(monthIdxVal, 10) - 1;
      const year = parseInt(yearVal, 10);

      const datesVal = (params.dates || "").split(",");
      const dates = datesVal.filter(Boolean).map((val) => parseInt(val, 10));

      return { monthIdx, year, dates };
    },

    syncParamsToData() {
      const { monthIdx, year, dates } = this.getParsedParams();

      this.monthIdx = monthIdx;
      this.year = year;
      this.activeDates = dates;

      const iterDate = new Date(this.year, this.monthIdx, 1);
      const startBlanks = iterDate.getDay();

      const endDate = new Date(this.year, this.monthIdx + 1, 0);
      const daysInMonth = endDate.getDate();

      const totalItems = startBlanks + daysInMonth;
      const endBlanks = (7 - (totalItems % 7)) % 7;

      const cells: (number | null)[] = [
        ...Array(startBlanks).fill(null),
        ...Array(daysInMonth)
          .fill(0)
          .map((_, i) => i + 1),
        ...Array(endBlanks).fill(null),
      ];

      this.columnCount = cells.length / 7;

      this.weekMap = weekdays.reduce(
        (acc, day, dayIdx) => {
          acc[day] = Array(this.columnCount)
            .fill(0)
            .map((_, weekIdx) => cells[weekIdx * 7 + dayIdx]);

          return acc;
        },
        {} as typeof this.weekMap,
      );
    },

    async init() {
      this.self.$watch("$store.urlParams.params", () => this.syncParamsToData());
      this.syncParamsToData();

      // @ts-expect-error load snapdom from cdn
      const { snapdom } = await import("https://cdn.jsdelivr.net/npm/@zumer/snapdom@3.2.0/+esm");
      this.snapdom = snapdom;
    },

    toggleActiveDate(nextVal: number | null) {
      if (!nextVal) {
        return;
      }

      const { dates } = this.getParsedParams();
      let nextDates = [...dates];

      if (nextDates.includes(nextVal)) {
        nextDates = nextDates.filter((val) => val !== nextVal);
      } else {
        nextDates = [...nextDates, nextVal];
      }

      this.self.$store.urlParams.update({ dates: nextDates.sort((a, b) => a - b).join(",") });
    },

    goMonth(val: number) {
      const { monthIdx, year } = this.getParsedParams();
      const currentDate = new Date(year, monthIdx, 1);
      currentDate.setMonth(currentDate.getMonth() - val);

      this.self.$store.urlParams.update({
        month: String(currentDate.getMonth() + 1),
        year: String(currentDate.getFullYear()),
        dates: null,
      });
    },

    reset() {
      this.self.$store.urlParams.set({});
    },

    async share() {
      const dom = document.querySelector(".container__snap")!;
      const domArgs = {
        format: "jpg",
        quality: 0.95,
        scale: 2,
        filename: "calendar",
        backgroundColor: "#fff",
      };

      if (canShareFile) {
        const blob = await this.snapdom.toBlob(dom, domArgs);
        const file = new File([blob], "calendar.jpg", { type: "image/jpeg" });

        try {
          await navigator.share({ files: [file] });
        } catch (err) {
          if ((err as Error)?.name === "AbortError") {
            return;
          }

          alert("Unable to share image!");
          console.error(err);
        }
      } else {
        await this.snapdom.download(dom, domArgs);
      }
    },
  };
}

Alpine.plugin(urlParams);
Alpine.data("root", root);
Alpine.start();
