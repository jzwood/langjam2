import evaluate from "./build.js";

function main() {
  const run = document.getElementById("run");
  const src = document.getElementById("source-code");
  const output = document.getElementById("output");

  run.addEventListener("click", () => {
    const result = evaluate(src.value);
    output.textContent = JSON.stringify(result, null, 2);
  });
}

main();
