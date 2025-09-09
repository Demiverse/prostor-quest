const startButton = document.getElementById("startButton");
const gameArea = document.getElementById("gameArea");

function startGame(e) {
  e.preventDefault();
  console.log("Игра началась!");
  startButton.style.display = "none";
  gameArea.classList.remove("hidden");
}

startButton.addEventListener("click", startGame);
startButton.addEventListener("touchstart", startGame);
