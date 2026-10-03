import "./style.css";
import Alpine from "alpinejs";

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
    weekdays,
    months,

    activeDates: [] as number[],
    monthIdx: today.getMonth(),
    year: today.getFullYear(),
    weekMap: {} as { [key: string]: (number | null)[] },
    columnCount: 0,

    getParams() {
      const url = new URL(location.href);

      const monthIdxVal = url.searchParams.get("month") || String(today.getMonth() + 1);
      const yearVal = url.searchParams.get("year") || String(today.getFullYear());

      const monthIdx = parseInt(monthIdxVal, 10) - 1;
      const year = parseInt(yearVal, 10);

      const datesVal = (url.searchParams.get("dates") || "").split(",");
      const dates = datesVal.filter(Boolean).map((val) => parseInt(val, 10));

      return { url, monthIdx, year, dates };
    },

    syncParams() {
      const { monthIdx, year, dates } = this.getParams();

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
      this.syncParams();
    },

    toggleActiveDate(nextVal: number | null) {
      if (!nextVal) {
        return;
      }

      const { url, dates } = this.getParams();
      let nextDates = [...dates];

      if (nextDates.includes(nextVal)) {
        nextDates = nextDates.filter((val) => val !== nextVal);
      } else {
        nextDates = [...nextDates, nextVal];
      }

      url.searchParams.set("dates", nextDates.sort((a, b) => a - b).join(","));
      history.replaceState({}, "", url);
      this.syncParams();
    },

    goMonth(val: number) {
      const { url, monthIdx, year } = this.getParams();
      const currentDate = new Date(year, monthIdx, 1);
      currentDate.setMonth(currentDate.getMonth() - val);

      url.searchParams.set("month", String(currentDate.getMonth() + 1));
      url.searchParams.set("year", String(currentDate.getFullYear()));
      url.searchParams.delete("dates");

      history.replaceState({}, "", url);
      this.syncParams();
    },

    reset() {
      const { url } = this.getParams();
      url.search = "";
      history.replaceState({}, "", url);
      this.syncParams();
    },

    async share() {
      // @ts-expect-error load snapdom from cdn
      const { snapdom } = await import("https://cdn.jsdelivr.net/npm/@zumer/snapdom@3.2.0/+esm");
      const dom = document.querySelector(".container__snap")!;
      const domArgs = { format: "png", scale: 2, filename: "calendar", backgroundColor: "#fff" };

      if (canShareFile) {
        const blob = await snapdom.toBlob(dom, domArgs);
        const file = new File([blob], "calendar.png", { type: "image/png" });

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
        await snapdom.download(dom, domArgs);
      }
    },
  };
}

Alpine.data("root", root);
Alpine.start();
