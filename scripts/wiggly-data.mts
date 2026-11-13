import paletteSixteen from "./palette-sixteen.json" with { type: "json" };

const brushMap = {
  button5: "33",
  button6: "34",
  button7: "35",
  button8: "36",
  button9: "37",
  button10: "38",
  button11: "39",
  button12: "40",
  button13: "41",
  button14: "42",
  button15: "43",
  button16: "44",
  button17: "45", // grays
  button18: "5", // dark pattern
  button19: "13", // light pattern
  button20: undefined, // erase colors
};

const origin = [430, 160];
const brushItems = Object.entries(brushMap)
  .map(([key, pattern]) => {
    return {
      key,
      type: "button",
      size: [16, 16],
      pos: [0, 0],
      script: "main.changebrush",
      pattern,
      value: 0,
    };
  })
  .map((val, idx) => {
    const gap = 4;

    return {
      ...val,
      pos: [
        origin[0] + Math.floor(idx / 4) * (val.size[0] + gap),
        origin[1] + (idx % 4) * (val.size[1] + gap),
      ],
    };
  })
  .map(({ key, ...val }) => {
    return `${key}:${JSON.stringify(val)}`.trim();
  });

export const newBrushSet = `
canvaslebrushsixteen:{"type":"canvas","size":[144,90],"pos":[425,155],"locked":1,"border":0,"image":"%%IMG3AJAAcQQwyEmrvTjrzbv/YIaMZGmeaKqubOu+cIwGcm3feK6T9O7/wGCrJywajzYicslsjpTOqNQHnVqvsCp2yzVpu2DsN0yOjsto5DnNDq7bcN17No+z6yW8Pa1H9PdlfX+AYXqDhGB4h4hddYuMXHOPkFtvk5RiLJeYV2ebnFZjn6BTX6OkUlqnqGYzrJhVlhOvZKu0nbestrmpvKS7vk3AwUvDxEfGx0XJym7NjMzPVNKE0dQ51tc32do13N0x3+Av4uND5nfofOpo5eyu74Xx8vON9fb3lfn6+7j9of8ABuw1sFVBJ+7yJby3sF7DeQ/jRXw3kV1FdRfRZTS3cVxHcB+7hdQ28lpJaielpXy2sllLZS+PxSQ2M1hNXzd55cy181ZPWj9fBdV1EGFRYUeZDEW19FfSYk/VREU21UhTUFc5ZYVVdVlXIVsphRhLtqzZs2grMFjLtq3bt3Djyp1Lt67du3jzwk3Lt6/fv4ADCx5MeEIE","scale":1}
${brushItems.join("\n")}
lestash1:{"type":"contraption","size":[57,35],"pos":[365,155],"def":"wigglyStash","widgets":{"preview":{},"stashbutton":{},"recallbutton":{},"data":{}}}
lestash2:{"type":"contraption","size":[57,35],"pos":[365,192],"def":"wigglyStash","widgets":{"preview":{},"stashbutton":{},"recallbutton":{},"data":{}}}

{script:main.changebrush}
on click do
 changetool[me "hi%i" format me.pattern]
end
{end}
`.trim();

const sixteenKeys = Object.keys(paletteSixteen)
  .map((name) => `"${name}"`)
  .join(",");
const sixteenVals = Object.values(paletteSixteen)
  .map((vals) => `"${vals.join("|")}"`)
  .join(",");

export const newColorPalette = `
pal16:{"type":"grid","size":[149,125],"pos":[0,169],"locked":1,"script":"options.palette16","headers":0,"lines":0,"widths":[128,82],"format":"ss","value":{"16 Color":[${sixteenKeys}],"palette":[${sixteenVals}]},"row":0,"col":0}

{script:options.palette16}
on click row do
 p:"|"split me.rowvalue.palette
 if 16~count p
  background.text:p[0]
  foreground.text:p[1]
  red       .text:p[2]
  pink      .text:p[3]
  orange    .text:p[4]
  yellow    .text:p[5]
  green     .text:p[6]
  darkgreen .text:p[7]
  blue      .text:p[8]
  cyan      .text:p[9]
  purple    .text:p[10]
  lightbrown.text:p[11]
  darkbrown .text:p[12]
  lightgray .text:p[13]
  mediumgray.text:p[14]
  darkgray  .text:p[15]
  f:"%06H"
  patterns[32]:f parse p[0]
  patterns[33]:f parse p[15]
  patterns[34]:f parse p[2]
  patterns[35]:f parse p[3]
  patterns[36]:f parse p[4]
  patterns[37]:f parse p[5]
  patterns[38]:f parse p[6]
  patterns[39]:f parse p[7]
  patterns[40]:f parse p[8]
  patterns[41]:f parse p[9]
  patterns[42]:f parse p[10]
  patterns[43]:f parse p[11]
  patterns[44]:f parse p[12]
  patterns[45]:f parse p[13]
  patterns[46]:f parse p[14]
  patterns[47]:f parse p[1]
 end
end
{end}
`.trim();

const totalBak = 4;

// `main.6` is required for override
export const undoRedoControls = `
buttonleundo:{"type":"button","size":[60,20],"pos":[225,302],"script":"main.6","text":"Undo"}
buttonleredo:{"type":"button","size":[60,20],"pos":[225,322],"script":"main.customredo","text":"Redo"}
cursorlestack:{"type":"slider","size":[60,10],"pos":[225,292],"interval":[0,${totalBak}],"style":"compact","show":"none"}
`.trim();

export const undoRedoScript = `
{script:main.6}
on click do
 undo[]
end
{end}

{script:main.customredo}
on click do
 redo[]
end
{end}
`.trim();

export const backupScript = `
on backup do
 if cursorlestack.value>0
  history.images:(3*1+cursorlestack.value) drop history.images
  cursorlestack.value:0
 end
 history.images:getframes[] , history.images
 history.images:((1+max cursorlestack.interval)*3) limit history.images
end

on getframes do
 target.frames..copy[]
end

on undo do
 if (cursorlestack.value=(count history.images)/3)|(0=count history.images)
  play["erase1"]
 else
  if cursorlestack.value=0 backup[] end
  cursorlestack.value:cursorlestack.value+1
  setframes[(3 window history.images)[cursorlestack.value]]
  play["erase2"]
 end
end

on redo do
 if cursorlestack.value=0
  play["erase1"]
 else
  cursorlestack.value:cursorlestack.value-1
  setframes[(3 window history.images)[cursorlestack.value]]
  if cursorlestack.value=0 history.images:(3 drop history.images) end
  play["erase2"]
 end
end
`.trim();
