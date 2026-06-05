import Alpine from "alpinejs";
import "./style.css";

interface PriceItem {
  id: string;
  price: number;
  priceDisplay: string;
  unit: number;
  unitDisplay: string;
  pricePerUnit: number;
}

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const decimalFormatter = new Intl.NumberFormat(undefined, {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const intFormatter = new Intl.NumberFormat(undefined, {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function root() {
  return {
    lowestId: "",
    priceList: [] as PriceItem[],

    get self() {
      type ReAlpine = Alpine.XDataContext & Alpine.Magics<{}>;
      return this as unknown as ReAlpine;
    },

    async init() {
      this.appendPriceList();
      this.appendPriceList();

      // compute lowest id
      this.self.$watch("priceList", () => {
        let nextLowestId = "";
        let lowestPricePerUnit = -1;

        for (const data of this.priceList) {
          if (data.pricePerUnit <= 0) {
            continue;
          }

          if (nextLowestId === "") {
            lowestPricePerUnit = data.pricePerUnit;
            nextLowestId = data.id;
          } else if (data.pricePerUnit < lowestPricePerUnit) {
            lowestPricePerUnit = data.pricePerUnit;
            nextLowestId = data.id;
          }
        }

        this.lowestId = nextLowestId;
      });
    },

    appendPriceList() {
      this.priceList = [
        ...this.priceList,
        {
          id: crypto.randomUUID(),
          price: 0,
          priceDisplay: "",
          unit: 0,
          unitDisplay: "",
          pricePerUnit: 0,
        },
      ];
    },

    removePriceList(id: string) {
      this.priceList = this.priceList.filter((data) => data.id !== id);
    },

    resetPriceList() {
      this.priceList = [];

      this.appendPriceList();
      this.appendPriceList();
    },

    handleNumeric(evt: Event, id: string, mode: "price" | "unit", hasDecimals: boolean) {
      const modeDisplay = mode === "price" ? "priceDisplay" : "unitDisplay";
      const divisor = hasDecimals ? 100 : 1;

      const elemVal = (evt.currentTarget as HTMLInputElement).value;
      const digits = digitsOnly(elemVal);

      this.priceList = this.priceList.map((data) => {
        if (data.id !== id) {
          return data;
        }

        if (digits.length === 0) {
          return {
            ...data,
            [mode]: 0,
            [modeDisplay]: "",
            pricePerUnit: 0,
          };
        }

        const rawNumber = Number(digits);
        const value = rawNumber / divisor;

        const nextData: PriceItem = {
          ...data,
          [mode]: value,
          [modeDisplay]: (hasDecimals ? decimalFormatter : intFormatter).format(value),
          pricePerUnit: 0,
        };

        if (nextData.unit !== 0) {
          nextData.pricePerUnit = nextData.price / nextData.unit;
        }

        return nextData;
      });
    },
  };
}

Alpine.data("root", root);
Alpine.start();
