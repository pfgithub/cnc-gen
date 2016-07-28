var fs = require("fs");
var convert = require("./converter.js");
var argv = require('yargs')
  /*.alias("w", "width")
  .describe("w", "The width (in px) of your input file")
  .alias("h", "height")
  .describe("h", "The height (in px) of your input file")*/
  .alias("s", "scale")
  .describe("s", "The width of the resulting output file")
  .alias("o", "output")
  .describe("o", "The location to put the resulting .tap file (overrites without warning!)")

  .alias("l", "rotation-cutoff")
  .default("l", 10)
  .describe("l", "The ammount allowed to be turned without pulling out the cutting tool (set to 360 if there is no rotation or 0 for all things to be stab/unstab)")

  .alias("d", "depth")
  .default("d", -0.5)
  .describe("d", "The ammount to put the cutting tool in so that it is just peaking out the other side")

  .alias("e", "scratch")
  .default("e", 0)
  .describe("e", "The ammount to put the cutting tool in so that it is a little bit infront of where it starts to cut the surface")

  .alias("f", "crease")
  .default("f", 0.5)
  .describe("f", "The ammount to put the cutting tool in so that it is creasing")

  .alias("ho", "height-offset")
  .default("ho", 2)
  .describe("ho", "The height offset for wierd things")

  .alias("p", "crease-offset")
  .default("p", 2.2)
  .describe("p", "The distance between the creasing tool and the knife")

  .alias("m", "x-multiplier")
  .default("m", 1)
  .describe("m", "The ammount to multiply final X values by")
  .alias("n", "y-multiplier")
  .default("n", -1)
  .describe("n", "The ammount to multiply final Y values by")

  .alias("c", "crease-input")
  .describe("c", "A file defining all the creases to be drawn")

  .help('help')

  .usage('Usage: $0 path/to/input/file --scale [num]')
  .demand(1)
  .demand(['s'])
  .argv;
//var path = require(argv._[0]);
var path = fs.readFileSync(argv._[0], "utf8");
if(argv.c)var creasepath = fs.readFileSync(argv.c, "utf8");

var result = convert(argv, path, creasepath);

if(argv.o){
  fs.writeFile(argv.o, result, function(err){
    if (err) throw err;
    console.log('It\'s saved! in same location.');
  });
}else{
  console.log(result);
}
