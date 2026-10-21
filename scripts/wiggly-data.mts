const brushMap = {
  button5: "39",
  button6: "36",
  button7: "33",
  button8: "22",
  button9: "34",
  button10: "35",
  button11: "37",
  button12: "5",
  button13: "40",
  button14: "41",
  button15: "38",
  button16: "13",
  button17: "42",
  button18: "43",
  button19: "44",
  button20: "45",
};

const origin = [416, 160];
const brushItems = Object.entries(brushMap)
  .map(([key, pattern]) => {
    return {
      key,
      type: "button",
      size: [20, 16],
      pos: [0, 0],
      script: "main.11",
      pattern,
      value: 0,
    };
  })
  .map((val, idx) => {
    const gap = 4;

    return {
      ...val,
      pos: [
        origin[0] + (idx % 4) * (val.size[0] + gap),
        origin[1] + Math.floor(idx / 4) * (val.size[1] + gap),
      ],
    };
  })
  .map(({ key, ...val }) => {
    return `${key}:${JSON.stringify(val)}`.trim();
  });

export const newBrushSet = `
canvas2:{"type":"canvas","size":[144,90],"pos":[410,155],"locked":1,"script":"main.10","border":0,"image":"%%IMG3AJAAcQQwyEmrvTjrzbv/YIaMZGmeaKqubOu+cIwGcm3feK6T9O7/wGCrJywajzYicslsjpTOqNQHnVqvsCp2yzVpu2DsN0yOjsto5DnNDq7bcN17No+z6yW8Pa1H9PdlfX+AYXqDhGB4h4hddYuMXHOPkFtvk5RiLJeYV2ebnFZjn6BTX6OkUlqnqGYzrJhVlhOvZKu0nbestrmpvKS7vk3AwUvDxEfGx0XJym7NjMzPVNKE0dQ51tc32do13N0x3+Av4uND5nfofOpo5eyu74Xx8vON9fb3lfn6+7j9of8ABuw1sFVBJ+7yJby3sF7DeQ/jRXw3kV1FdRfRZTS3cVxHcB+7hdQ28lpJaielpXy2sllLZS+PxSQ2M1hNXzd55cy181ZPWj9fBdV1EGFRYUeZDEW19FfSYk/VREU21UhTUFc5ZYVVdVlXIVsphRhLtqzZs2grMFjLtq3bt3Djyp1Lt67du3jzwk3Lt6/fv4ADCx5MeEIE","scale":1}
${brushItems.join("\n")}

{script:main.10}
on click do
end
{end}

{script:main.11}
on click do
 changetool[me "hi%i" format me.pattern]
end
{end}
`.trim();

export const newColorPalette = `
pal16:{"type":"grid","size":[164,98],"pos":[3,65],"locked":1,"script":"options.6","headers":1,"lines":0,"widths":[128,82],"format":"ss","value":{"16 Color":["Sweetie 16","STEAM LORDS","SLOWSHOUT16","Tiffany Lamp","Pantheons16","Nature Country","Psyche16","Twilight Bog","Yu-No (PC-98)","Sulu","Sara-98A","Retrobubble.","Twilight Town","Pastel EGA","Sickly Rainbow","Groovy-16","Grayscale","Jonk 16","System Mini 16","Cardboard Paint","Autumn Breeze","Miyazaki 16","Pastel Horizon","Shido CyberNeon","Blighted Paint","Aragon16","Vampire Waltz","Pastel Pop-16"],"palette":["f4f4f4|1a1c2c|94b0c2|566c86|333c57|73eff7|41a6f6|3b5dc9|257179|38b764|a7f070|ffcd75|ef7d57|29366f|b13e53|5d275d","c0d1cc|170e19|213b25|3a604a|4f7754|a19f7c|77744f|775c4f|603b3a|3b2137|2f213b|433a60|4f5277|65738c|7c94a1|a0b9ba","eedebe|23222f|b9b595|8e9593|638691|c18080|6a7d5f|485a5c|4e5d79|cf982e|b97022|544a36|52485f|a75141|754242|37242c","dff2f8|51468c|fddb97|e3c179|b0a273|91754b|dff2f8|aad8eb|61c0ec|5699dd|9e4d54|8a3c42|dda0af|a880a3|acb0e5|706db2","fff4e0|2b2b26|939487|cecfbf|adac8e|6a6c56|4b3b9c|3e88b7|eca549|ef692f|ac2925|57253b|db3b5d|f28a91|f7a983|ffd8ba","e3eca7|090909|addcd3|6ea666|4f742a|3c1806|8d3a17|d2815f|c57738|ca9037|e8d973|dadc72|b8af4e|6f782a|383d12|101a09","fafafa|071822|ebe8da|ff7196|eb418a|304059|f0007d|7f0d4b|962bb5|3c43ad|ffdd5f|fbb03b|b9e226|5ab00f|5dd8d6|40a095","e1e6ea|1f1714|a48db6|785a96|c8bfbf|b8948e|a66470|704b63|383f38|727546|839c77|b8cfb9|89baab|5d8da2|4e5a6d|343943","ffffff|000000|99aabb|ff99aa|dd4455|ffbb66|339988|556666|444444|222222|bbccff|5566cc|ffddcc|eeaa99|bb7766|773333","e3e3f2|474751|8e8ea3|ecbcff|bcecff|bcffec|ecffbc|ffecbc|ffbcec|babad3|b570ee|70b5ee|70eeb5|b5ee70|eeb570|ee70b5 ","fffff2|1c0810|a5baae|71958d|657150|713410|551008|7d1818|ae4c30|ca713c|daa56d|ead6aa|f69d9d|ee7175|e24050|b61030","ffface|120e1f|f68b69|e0b56d|9e8f84|ab3229|d7793f|fff169|654147|6a2435|95533d|62ab46|284646|312139|525b80|525b80","ffc5a3|21181b|f1b640|ff8a32|e64639|ac2f45|be6a62|904d57|771d50|4e1d4c|686f9a|404974|283440|3d2935|291d2b|1b1f22","f6f6f6|414141|dd4274|db7497|1db37b|70e6ae|4c96d7|a5d2f3|bf2faf|df7cd3|cbae25|faf8ac|bfbfbf|8d8d8d|41bcbc|5fe4e4","faffec|5a5aff|7785bf|add640|92ae80|ae48ae|8552d6|d63d85|ff325a|f16645|e3992e|c8ff00|d6cc17|d3d6f0|abaef5|8485fa","fbffeb|0d0023|ffcbcd|ff9bd9|96ffc2|ff615b|f50070|0c006b|b2ff00|ffc900|e7dcb9|9aa0f5|aeb500|007d8d|b213b9|316eff","ffffff|000000|e7e7e7|d1d1d1|bdbdbd|ababab|9b9b9b|8c8c8c|7e7e7e|717171|646464|565656|474747|383838|282828|181818","f4f0ea|242e36|d6d6d6|a1b0be|6988a1|b7bca2|798766|455951|595b7c|95819d|c9a5a9|f4dec2|704f4f|ebc790|e39669|b7635b","fcfcfc|000000|f8ec20|3cd4e4|f8a850|ac581c|fc74ec|b82cd0|70f828|208800|fc4848|a82814|7070fc|b0b0b8|68605c|1c38ac","d2b2a0|3e2a2e|be7a80|854865|4d3956|575777|85a7b6|518183|32554f|457c60|75a165|d2a865|b9684f|6f544c|b18979|8f3641","f6f0e9|2d1a15|6b2511|b61d1d|ce421a|e56520|e77e1b|f7a31b|ffbb18|d9cdbd|e5d1a3|e5c57b|e1b36a|703424|904936|a35c49","ebecdc|232228|c3d5c7|2485a6|284261|e3c054|a1bf41|55a058|1e7453|e6928a|c65046|754d45|54bad2|b8b095|878573|5f5854","ffffff|53437f|a89fcc|ffd9e8|ff9bb6|9968e2|be9bff|7fceff|6d81ff|2c6f99|00bcaa|ff5470|ff9b71|c48f9e|ffd9ae|8e586f","ffffff|00033c|add4fa|4e6ea8|2a2e79|ff004e|b10585|600088|ac29ce|ff5cff|00f7ff|008ac5|003884|005260|0aff52|009d4a","c9c4b6|41303a|749c6b|457967|9fb49a|6ca28d|4b7b7d|43526c|453c55|976a4a|ac9253|b4b18f|976c73|6c475a|7e4d4b|583a41","f9f8dd|272120|d2e291|a8d455|9cab6c|5c8d58|3b473c|e0bf7a|ba9572|876661|b7c4d0|8daad6|6b72d4|9197b6|8b8893|54555c","c1c799|120004|ffffa6|94ffa6|c1c799|269e66|3e7d6f|3b3441|710b31|b87b4d|a63a3a|a10d2d|664ca1|2f1433|6f81c7|00c5cc","fffcff|000000|e6e1f2|b2b7e1|7b8ac6|ffd9f4|caaff5|ad80a6|fba2d7|fae0c7|f0abab|97c4aa|bfedf5|e1adc3|73c9eb|595b7d"]},"row":0,"col":0}

{script:options.6}
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

export const undoRedoControls = `
button3:{"type":"button","size":[60,20],"pos":[225,302],"script":"main.6","text":"Undo"}
button21:{"type":"button","size":[60,20],"pos":[225,322],"script":"main.12","text":"Redo"}
cursor:{"type":"slider","size":[60,10],"pos":[225,292],"interval":[0,3],"style":"compact","show":"none"}
`.trim();

export const undoRedoScript = `
{script:main.6}
on click do
 undo[]
end
{end}

{script:main.12}
on click do
 redo[]
end
{end}
`.trim();

export const backupScript = `
on backup do
 if cursor.value>0
  history.images:(3*1+cursor.value) drop history.images
  cursor.value:0
 end
 history.images:getframes[] , history.images
 history.images:((1+max cursor.interval)*3) limit history.images
end

on getframes do
 target.frames..copy[]
end

on undo do
 if (cursor.value=(count history.images)/3)|(0=count history.images)
  play["erase1"]
 else
  if cursor.value=0 backup[] end
  cursor.value:cursor.value+1
  setframes[(3 window history.images)[cursor.value]]
  play["erase2"]
 end
end

on redo do
 if cursor.value=0
  play["erase1"]
 else
  cursor.value:cursor.value-1
  setframes[(3 window history.images)[cursor.value]]
  if cursor.value=0 history.images:(3 drop history.images) end
  play["erase2"]
 end
end
`.trim();
