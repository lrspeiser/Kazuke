// main.js - don't remove this header or logs

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gridSize = 6;
let canvasSize = 500; // This will be updated in resizeGame
let tileSize = canvasSize / gridSize;
const tileGridSize = 6;
let tileGrid = Array(tileGridSize).fill(null);
let emptyTileSpots = Array(tileGridSize).fill(true);
let score = 0;
let highestScore = localStorage.getItem("highestScore") || 0; // Retrieve highest score from localStorage
let grid = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(null));
let tilesContainer = document.getElementById("tiles");
let selectedTile = null;
const stoneImage = new Image();
stoneImage.src = "/stone.jpg";

function sendLogToServer(logData) {
    fetch("/log", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(logData),
    }).catch((error) => {
        console.error("Error sending log to server:", error);
    });
}

const originalConsoleLog = console.log;

console.log = function (...args) {
    originalConsoleLog(...args); // Call the original console.log
    sendLogToServer({
        level: "log",
        messages: args,
        timestamp: new Date().toISOString(),
    });
};

// Do the same for other console methods if needed
const originalConsoleError = console.error;
console.error = function (...args) {
    originalConsoleError(...args);
    sendLogToServer({
        level: "error",
        messages: args,
        timestamp: new Date().toISOString(),
    });
};

const originalConsoleWarn = console.warn;
console.warn = function (...args) {
    originalConsoleWarn(...args);
    sendLogToServer({
        level: "warn",
        messages: args,
        timestamp: new Date().toISOString(),
    });
};

function calculateGameSize() {
    const gameContainer = document.querySelector(".game-container");
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const containerPadding = 20; // Accounting for padding
    const headerHeight = document.querySelector(".header").offsetHeight;
    const tilesHeight = document.getElementById("tiles").offsetHeight;

    // Calculate available height for the game board
    const availableHeight =
        windowHeight - headerHeight - tilesHeight - containerPadding * 2;

    // Use the smaller of available width or height
    const size = Math.min(windowWidth - containerPadding * 2, availableHeight);

    console.log("[calculateGameSize] Available space:", {
        width: windowWidth - containerPadding * 2,
        height: availableHeight,
    });
    console.log("[calculateGameSize] Calculated game size:", size);

    return size;
}

function resizeGame() {
    console.log("[resizeGame] Resizing game elements");
    const oldCanvasSize = canvasSize;
    canvasSize = calculateGameSize();
    const scaleFactor = canvasSize / oldCanvasSize;
    tileSize = canvasSize / gridSize;

    // Update canvas size
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;

    // Resize tile grid
    const gameBoardRect = canvas.getBoundingClientRect();
    const tileSizeToUse = gameBoardRect.width / tileGridSize;

    // Update tile container size and position
    tilesContainer.style.width = `${gameBoardRect.width}px`;
    tilesContainer.style.height = `${tileSizeToUse}px`;
    tilesContainer.style.left = `${gameBoardRect.left}px`;
    tilesContainer.style.top = `${gameBoardRect.top - tileSizeToUse - 10}px`; // 10px gap

    // Update CSS for tiles
    let style = document.getElementById('dynamic-style');
    if (!style) {
        style = document.createElement("style");
        style.id = 'dynamic-style';
        document.head.appendChild(style);
    }
    style.textContent = `
        .tile {
            position: absolute;
            width: ${tileSizeToUse}px;
            height: ${tileSizeToUse}px;
            cursor: move;
        }
    `;

    // Resize and reposition tiles
    tileGrid.forEach((tile, index) => {
        if (tile) {
            tile.style.width = `${tileSizeToUse}px`;
            tile.style.height = `${tileSizeToUse}px`;
            tile.style.left = `${index * tileSizeToUse}px`;
            tile.style.top = '0px';

            // Redraw the tile with the new size
            const canvas = tile.querySelector('canvas');
            canvas.width = tileSizeToUse;
            canvas.height = tileSizeToUse;
            const ctx = canvas.getContext("2d");
            drawTileOnCanvas(ctx, 0, 0, tileSizeToUse, tileSizeToUse, tile.dataset.value);
        }
    });

    console.log("[resizeGame] New canvas size:", canvasSize);
    console.log("[resizeGame] New tile size:", tileSizeToUse);
    console.log("[resizeGame] Scale factor:", scaleFactor);
    console.log(`[resizeGame] Updated tile grid position: left=${tilesContainer.style.left}, top=${tilesContainer.style.top}`);

    drawGrid();
}

// Add this at the end of your initialization code
const initialStyle = document.createElement("style");
initialStyle.textContent = `
    #tiles {
        position: relative;
        margin-bottom: 10px;
    }
    .tile {
        position: absolute;
        cursor: move;
    }
`;
document.head.appendChild(initialStyle);

window.addEventListener("orientationchange", resizeGame);
window.addEventListener("resize", resizeGame);

if (stoneImage.complete) {
    console.log("[Initialization] Stone image already loaded");
    initializeGrid();
    initializeTiles();
    resizeGame();
} else {
    stoneImage.onload = () => {
        console.log("[Initialization] Stone image loaded");
        initializeGrid();
        initializeTiles();
        resizeGame();
    };
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("high-score").textContent =
        `Your highest score: ${highestScore}`;
});

function initializeGrid() {
    console.log("[initializeGrid] Initializing grid with preset values");
    const cornerPositions = [
        { row: 1, col: 1 },
        { row: 1, col: 4 },
        { row: 4, col: 1 },
        { row: 4, col: 4 },
    ];

    cornerPositions.forEach((pos) => {
        const randomNumber = getRandomRedNumber();
        grid[pos.row][pos.col] = {
            value: randomNumber,
            isRed: true,
        };
        console.log(
            `[initializeGrid] Placed red tile at (${pos.row}, ${pos.col}) with value ${randomNumber}`,
        );
    });
}

function getRandomRedNumber() {
    console.log(
        "[getRandomRedNumber] Generating random number between 10 and 18",
    );
    const min = 10;
    const max = 18;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(
        `[getRandomRedNumber] Generated random number: ${randomNumber}`,
    );
    return randomNumber;
}

function initializeTiles() {
    console.log("[initializeTiles] Initializing draggable tiles");
    tilesContainer.innerHTML = ""; // Clear existing tiles
    emptyTileSpots = Array(tileGridSize).fill(true); // Reset empty spots

    const gameBoard = document.getElementById("gameCanvas");
    const gameBoardRect = gameBoard.getBoundingClientRect();
    const tileSizeToUse = gameBoardRect.width / tileGridSize;

    // Set the container size
    tilesContainer.style.width = `${gameBoardRect.width}px`;
    tilesContainer.style.height = `${tileSizeToUse}px`;

    // Position the tile tray above the game board
    tilesContainer.style.position = 'absolute';
    tilesContainer.style.left = `${gameBoardRect.left}px`;
    tilesContainer.style.top = `${gameBoardRect.top - tileSizeToUse - 10}px`; // 10px gap

    for (let i = 0; i < tileGridSize; i++) {
        createTile(tileSizeToUse, i);
    }

    console.log(`[initializeTiles] Tile grid position: left=${tilesContainer.style.left}, top=${tilesContainer.style.top}`);
    console.log(`[initializeTiles] Game board position: left=${gameBoardRect.left}px, top=${gameBoardRect.top}px`);
}


function createTile(tileSizeToUse, index) {
    console.log("[createTile] Creating a new draggable tile");
    const tileContainer = document.createElement("div");
    tileContainer.className = "tile";
    tileContainer.draggable = true;

    const canvas = document.createElement("canvas");
    canvas.width = tileSizeToUse;
    canvas.height = tileSizeToUse;
    const ctx = canvas.getContext("2d");

    const randomNumber = getRandomNumber();

    // Use the same drawing function as for placed tiles
    drawTileOnCanvas(ctx, 0, 0, tileSizeToUse, tileSizeToUse, randomNumber);

    tileContainer.appendChild(canvas);
    tileContainer.dataset.value = randomNumber;
    tileContainer.dataset.index = index;
    tileContainer.addEventListener("dragstart", handleDragStart);
    tileContainer.addEventListener("dragend", handleDragEnd);
    tileContainer.addEventListener("touchstart", handleTouchStart);
    tileContainer.addEventListener("touchmove", handleTouchMove);
    tileContainer.addEventListener("touchend", handleTouchEnd);

    // Add the tile to the container and tileGrid
    tilesContainer.appendChild(tileContainer);
    tileGrid[index] = tileContainer;
    emptyTileSpots[index] = false;

    // Position the tile in its correct spot
    const left = index * tileSizeToUse;
    const top = 0;

    tileContainer.style.position = "absolute";
    tileContainer.style.left = `${left}px`;
    tileContainer.style.top = `${top}px`;
    tileContainer.style.width = `${tileSizeToUse}px`;
    tileContainer.style.height = `${tileSizeToUse}px`;

    console.log(`[createTile] Created tile with value ${randomNumber} at position (${left}, ${top})`);
}


function drawTileOnCanvas(ctx, x, y, width, height, value) {
    // Clear the canvas
    ctx.clearRect(x, y, width, height);

    // Draw tile shadow
    drawTileShadow(ctx, x + 2, y + 2, width - 4, height - 4, 15, 8);

    // Draw tile with perspective
    drawTileWithPerspective(ctx, x, y, width, height, 4);

    // Draw rounded rectangle
    drawRoundedRect(ctx, x + 2, y + 2, width - 4, height - 4, 10);

    // Draw the stone image
    if (stoneImage.complete) {
        ctx.drawImage(stoneImage, x + 2, y + 2, width - 4, height - 4);
    } else {
        ctx.fillStyle = "#d0d0d0"; // Fallback color if image is not loaded
        ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
    }

    // Add gradient overlay
    drawTileWithGradient(ctx, x + 2, y + 2, width - 4, height - 4);

    // Add bevel effect
    drawTileBevel(ctx, x + 2, y + 2, width - 4, height - 4);

    // Draw the borders
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + width - 2, y + 2);
    ctx.lineTo(x + width - 2, y + height - 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"; // White for top and right
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + 2, y + height - 2);
    ctx.lineTo(x + width - 2, y + height - 2);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"; // Dark for left and bottom
    ctx.stroke();

    // Draw the text
    ctx.fillStyle = "#444";
    ctx.font = `bold ${width / 3}px 'Noto Sans JP', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Text shadow for 3D effect
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
    ctx.shadowOffsetX = -1;
    ctx.shadowOffsetY = -1;
    ctx.shadowBlur = 2;
    ctx.fillText(value.toString(), x + width / 2, y + height / 2);

    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(value.toString(), x + width / 2, y + height / 2);

    // Reset shadow
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;

    // Store the value as a data attribute
    ctx.canvas.setAttribute("data-value", value);
}

function getRandomNumber() {
    const randomNumber = Math.floor(Math.random() * 10);
    console.log(
        `[getRandomNumber] Generated random number between 0 and 9: ${randomNumber}`,
    );
    return randomNumber;
}

function drawTileShadow(ctx, x, y, width, height, blur, spread) {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = spread;
    ctx.shadowOffsetY = spread;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
}

function drawTileWithGradient(ctx, x, y, width, height) {
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
    gradient.addColorStop(1, "rgba(200, 200, 200, 0.3)");

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
}

function drawEnhancedGridLines(ctx, gridSize, tileSize) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 2;

    for (let i = 0; i <= gridSize; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * tileSize, 0);
        ctx.lineTo(i * tileSize, gridSize * tileSize);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * tileSize);
        ctx.lineTo(gridSize * tileSize, i * tileSize);
        ctx.stroke();
    }

    // Add subtle darker lines for depth
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * tileSize + 1, 0);
        ctx.lineTo(i * tileSize + 1, gridSize * tileSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * tileSize + 1);
        ctx.lineTo(gridSize * tileSize, i * tileSize + 1);
        ctx.stroke();
    }
}

function drawTileWithPerspective(ctx, x, y, width, height, depth) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width - depth, y + depth);
    ctx.lineTo(x - depth, y + depth);
    ctx.closePath();
    ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + width, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width - depth, y + height + depth);
    ctx.lineTo(x + width - depth, y + depth);
    ctx.closePath();
    ctx.fillStyle = "rgba(150, 150, 150, 0.5)";
    ctx.fill();
}

function drawTileBevel(ctx, x, y, width, height) {
    const bevelWidth = 2;

    // Top and left (lighter)
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillRect(x, y, width, bevelWidth);
    ctx.fillRect(x, y, bevelWidth, height);

    // Bottom and right (darker)
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(x, y + height - bevelWidth, width, bevelWidth);
    ctx.fillRect(x + width - bevelWidth, y, bevelWidth, height);
}

function handleDragStart(event) {
    console.log("[handleDragStart] Dragging tile");
    const value = event.target.dataset.value;
    event.dataTransfer.setData("text/plain", value);
    setTimeout(() => event.target.classList.add("hide"), 0);
}

function handleDragEnd(event) {
    console.log("[handleDragEnd] Finished dragging tile");
    event.target.classList.remove("hide");
}

function handleTouchStart(event) {
    console.log("[handleTouchStart] Touch start on tile");
    event.preventDefault();
    selectedTile = event.target.closest(".tile");
    selectedTile.classList.add("selected");
    selectedTile.style.zIndex = "1000";

    const touch = event.touches[0];
    const tileRect = selectedTile.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // Calculate the offset of the touch point relative to the tile's top-left corner
    const offsetX = touch.clientX - tileRect.left;
    const offsetY = touch.clientY - tileRect.top;

    // Store these offsets and the initial touch position for use in handleTouchMove
    selectedTile.dataset.offsetX = offsetX;
    selectedTile.dataset.offsetY = offsetY;
    selectedTile.dataset.initialTouchX = touch.clientX;
    selectedTile.dataset.initialTouchY = touch.clientY;

    // Center the tile under the user's finger
    const newLeft = touch.clientX - canvasRect.left - tileRect.width / 2;
    const newTop = touch.clientY - canvasRect.top - tileRect.height / 2;

    selectedTile.style.position = "absolute";
    selectedTile.style.left = `${newLeft}px`;
    selectedTile.style.top = `${newTop}px`;

    console.log(`[handleTouchStart] Initial touch position: { x: ${touch.clientX}, y: ${touch.clientY} }`);
    console.log(`[handleTouchStart] Tile original position: { left: ${tileRect.left}, top: ${tileRect.top} }`);
    console.log(`[handleTouchStart] Tile centered at: { left: ${newLeft}, top: ${newTop} }`);
    console.log(`[handleTouchStart] Canvas position: { left: ${canvasRect.left}, top: ${canvasRect.top} }`);
    console.log(`[handleTouchStart] Tile offset: { offsetX: ${offsetX}, offsetY: ${offsetY} }`);
}

function handleTouchMove(event) {
    event.preventDefault();
    if (selectedTile) {
        const touch = event.touches[0];
        const canvasRect = canvas.getBoundingClientRect();
        const tileTrayRect = tilesContainer.getBoundingClientRect();
        const gapBetweenTrayAndBoard = 10; // The gap between the tile tray and the board

        // Retrieve the stored offsets and initial touch position
        const offsetX = parseFloat(selectedTile.dataset.offsetX);
        const offsetY = parseFloat(selectedTile.dataset.offsetY);
        const initialTouchX = parseFloat(selectedTile.dataset.initialTouchX);
        const initialTouchY = parseFloat(selectedTile.dataset.initialTouchY);

        // Calculate the movement of the finger since the initial touch
        const deltaX = touch.clientX - initialTouchX;
        const deltaY = touch.clientY - initialTouchY;

        // Move the tile by the same delta as the finger movement
        let newX = parseFloat(selectedTile.style.left) + deltaX;
        let newY = parseFloat(selectedTile.style.top) + deltaY;

        // Calculate the maximum Y position considering the tile tray, the gap, and the canvas height
        const maxY = tileTrayRect.height + gapBetweenTrayAndBoard + canvasRect.height - selectedTile.offsetHeight;
        newY = Math.max(0, Math.min(newY, maxY));

        selectedTile.style.left = `${newX}px`;
        selectedTile.style.top = `${newY}px`;

        // Update the initial touch position for the next move event
        selectedTile.dataset.initialTouchX = touch.clientX;
        selectedTile.dataset.initialTouchY = touch.clientY;

        console.log(`[handleTouchMove] Touch position: { x: ${touch.clientX}, y: ${touch.clientY} }`);
        console.log(`[handleTouchMove] New tile position: { x: ${newX}, y: ${newY} }`);
        console.log(`[handleTouchMove] Delta movement: { deltaX: ${deltaX}, deltaY: ${deltaY} }`);
        console.log(`[handleTouchMove] Canvas position: { left: ${canvasRect.left}, top: ${canvasRect.top} }`);
        console.log(`[handleTouchMove] Tile tray height: ${tileTrayRect.height}, Gap: ${gapBetweenTrayAndBoard}, Max Y: ${maxY}`);
    }
}




function handleTouchEnd(event) {
    console.log("[handleTouchEnd] Touch end on tile");
    event.preventDefault();
    if (selectedTile) {
        selectedTile.classList.remove("selected");
        selectedTile.style.zIndex = "";
        const rect = canvas.getBoundingClientRect();
        const touch = event.changedTouches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const col = Math.floor(x / tileSize);
        const row = Math.floor(y / tileSize);
        const number = parseInt(selectedTile.dataset.value, 10);
        const tileIndex = parseInt(selectedTile.dataset.index, 10);

        console.log(`[handleTouchEnd] Attempted placement at board position: row=${row}, col=${col}`);

        if (y >= 0 && row >= 0 && row < gridSize && col >= 0 && col < gridSize && grid[row][col] === null) {
            placeTile(row, col, number);
            selectedTile.remove();
            emptyTileSpots[tileIndex] = true;
            console.log(`[handleTouchEnd] Tile removed from position ${tileIndex}`);
            createTile(tileSize, findEmptyTileSpot());
        } else {
            // Return the tile to its original position
            const left = tileIndex * (tileSize + 5); // Add 5px gap
            selectedTile.style.position = "absolute";
            selectedTile.style.left = `${left}px`;
            selectedTile.style.top = "0px";
            console.log(`[handleTouchEnd] Tile returned to original position ${tileIndex}`);
        }
        selectedTile = null;
    }
}

function findEmptyTileSpot() {
    const emptySpot = emptyTileSpots.indexOf(true);
    console.log(`[findEmptyTileSpot] Found empty spot at index ${emptySpot}`);
    return emptySpot !== -1 ? emptySpot : 0; // Default to 0 if no empty spot found
}

canvas.addEventListener("dragover", (event) => event.preventDefault());

canvas.addEventListener("drop", (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);
    const number = parseInt(event.dataTransfer.getData("text/plain"), 10);

    console.log(`[drop] Attempted placement at board position: row=${row}, col=${col}`);

    // Ensure y coordinate is within the canvas height
    if (y >= 0 && y < canvasSize && row >= 0 && row < gridSize && col >= 0 && col < gridSize && grid[row][col] === null) {
        placeTile(row, col, number);
        const droppedTile = document.querySelector(".tile.hide");
        if (droppedTile) {
            const tileIndex = parseInt(droppedTile.dataset.index, 10);
            droppedTile.remove();
            emptyTileSpots[tileIndex] = true;
            console.log(`[drop] Tile removed from position ${tileIndex}`);
            createTile(tileSize, findEmptyTileSpot());
        }
    } else {
        console.log(`[drop] Invalid drop location or tile spot occupied at row=${row}, col=${col}`);
    }
});


function placeTile(row, col, number) {
    console.log(
        `[placeTile] Placing tile with value ${number} at (${row}, ${col})`,
    );
    grid[row][col] = { value: number, isRed: false };

    let directions = ["horizontal", "vertical"];
    let allCombinations = {};
    let scores = {};

    directions.forEach((direction) => {
        let { combinations, score } = checkLineForMatches(row, col, direction);
        allCombinations[direction] = combinations;
        scores[direction] = score;
    });

    logAllCombinations(allCombinations, scores);

    let totalScore = calculateTotalScore(scores);

    console.log(`[placeTile] Total score: ${totalScore}`);

    if (totalScore > 0) {
        updateScore(totalScore);
        clearMatchedTiles(allCombinations); // Ensure all matched tiles are cleared
    } else {
        console.log(`[placeTile] No valid matches found. No score update.`);
    }

    drawGrid();

    if (isGameOver()) {
        console.log("[placeTile] Game Over. Final score:", score);
        alert(`Game Over! Your final score is ${score}`);
        updateHighestScore(score); // Update highest score if game is over
    }
}

function clearMatchedTiles(allCombinations) {
    console.log("[clearMatchedTiles] Clearing matched tiles");

    let clearedTiles = new Set(); // Track cleared tiles

    for (let direction in allCombinations) {
        allCombinations[direction].forEach((combo) => {
            if (combo.isValid) {
                combo.cells.forEach((cell) => {
                    let key = `${cell.row},${cell.col}`;
                    if (!clearedTiles.has(key)) {
                        // Check if tile has been cleared
                        clearedTiles.add(key); // Mark tile as cleared
                        if (grid[cell.row][cell.col].isRed) {
                            grid[cell.row][cell.col] = {
                                value: getRandomRedNumber(),
                                isRed: true,
                            };
                            console.log(
                                `[clearMatchedTiles] Replaced red tile at (${cell.row}, ${cell.col}) with new value ${grid[cell.row][cell.col].value}`,
                            );
                        } else {
                            grid[cell.row][cell.col] = null;
                            console.log(
                                `[clearMatchedTiles] Cleared tile at (${cell.row}, ${cell.col})`,
                            );
                        }
                    }
                });
            }
        });
    }
}

function checkLineForMatches(row, col, direction) {
    console.log(
        `[checkLineForMatches] Checking ${direction} at (${row}, ${col})`,
    );
    let line = getLine(row, col, direction);
    console.log(`[checkLineForMatches] Line: ${JSON.stringify(line)}`);
    let combinations = findAllCombinations(line);
    console.log(
        `[checkLineForMatches] Combinations: ${JSON.stringify(combinations)}`,
    );
    let score = calculateDirectionScore(combinations);
    return { combinations, score };
}

function getLine(row, col, direction) {
    let line = [];
    switch (direction) {
        case "horizontal":
            line = grid[row].map((cell, i) =>
                cell ? { row, col: i, ...cell } : null,
            );
            break;
        case "vertical":
            line = grid.map((r, i) =>
                r[col] ? { row: i, col, ...r[col] } : null,
            );
            break;
    }
    return line.filter((cell) => cell !== null); // Remove null cells
}

function findAllCombinations(line) {
    let combinations = [];
    for (let i = 0; i < line.length - 2; i++) {
        for (let j = i + 2; j < line.length; j++) {
            let subLine = line.slice(i, j + 1);
            // Check if the subline is consecutive (no gaps) and has at least three tiles
            if (subLine.length >= 3 && isConsecutive(subLine)) {
                let values = subLine.map((cell) => cell.value);
                let sum = values.reduce((a, b) => a + b, 0);
                combinations.push({
                    cells: subLine,
                    values: values,
                    sum: sum,
                    isValid: isValidCombination(values, sum),
                });
            }
        }
    }
    return combinations;
}

// Helper function to check if subLine is consecutive without gaps
function isConsecutive(subLine) {
    for (let i = 1; i < subLine.length; i++) {
        if (
            subLine[i - 1].col !== subLine[i].col - 1 &&
            subLine[i - 1].row !== subLine[i].row - 1
        ) {
            return false;
        }
    }
    return true;
}

function checkSubLineForSum(subLine, direction) {
    console.log(
        `[checkSubLineForSum] Checking ${direction} sub-line for sum`,
        subLine.map((tile) => tile.value),
    );
    if (subLine.length < 3) {
        console.log(
            `[checkSubLineForSum] Sub-line too short (${subLine.length} < 3). No match possible.`,
        );
        return 0;
    }

    let values = subLine.map((tile) => tile.value);
    let sum = values.reduce((a, b) => a + b, 0);

    if (isValidCombination(values, sum)) {
        console.log(
            `[checkSubLineForSum] ${direction} match found: valid combination`,
        );
        return Math.max(...values);
    }

    console.log(
        `[checkSubLineForSum] No ${direction} match found for this sub-line`,
    );
    return 0;
}

// Helper function to check if a combination is valid
function isValidCombination(values, sum) {
    return (
        sum - values[values.length - 1] === values[values.length - 1] ||
        values[0] === sum - values[0]
    );
}

function calculateCombinations(combo) {
    let combinations = [];

    for (let i = 0; i < combo.length - 2; i++) {
        for (let j = i + 2; j < combo.length; j++) {
            let subCombo = combo.slice(i, j + 1);
            let values = subCombo.map((cell) => cell.value);
            let sum = values.reduce((a, b) => a + b, 0);
            combinations.push({
                cells: subCombo,
                values: values,
                sum: sum,
                isValid:
                    sum - values[values.length - 1] ===
                        values[values.length - 1] ||
                    values[0] === sum - values[0],
            });
        }
    }

    return combinations;
}

function calculateDirectionScore(combinations) {
    return combinations.reduce((score, combo) => {
        if (combo.isValid) {
            return score + Math.max(...combo.values);
        }
        return score;
    }, 0);
}

function logAllCombinations(allCombinations, scores) {
    console.log("[logAllCombinations] All possible combinations:");
    Object.entries(allCombinations).forEach(([direction, combinations]) => {
        console.log(
            `  ${direction.toUpperCase()} (Score: ${scores[direction]}):`,
        );
        combinations.forEach((combo) => {
            console.log(
                `    ${combo.values.join(" + ")} = ${combo.sum} (${combo.isValid ? "Valid" : "Invalid"})`,
            );
        });
    });
}

function calculateTotalScore(scores) {
    let validScores = Object.values(scores).filter((score) => score > 0);
    if (validScores.length > 1) {
        return validScores.reduce((a, b) => a * b, 1);
    } else if (validScores.length === 1) {
        return validScores[0];
    }
    return 0;
}

function removeLineTiles(combination) {
    console.log(
        "[removeLineTiles] Removing tiles",
        combination.cells.map((cell) => ({
            row: cell.row,
            col: cell.col,
            value: cell.value,
        })),
    );
    combination.cells.forEach((cell) => {
        if (cell.isRed) {
            grid[cell.row][cell.col] = {
                value: getRandomRedNumber(),
                isRed: true,
            };
            console.log(
                `[removeLineTiles] Replaced red tile at (${cell.row}, ${cell.col}) with new value ${grid[cell.row][cell.col].value}`,
            );
        } else {
            grid[cell.row][cell.col] = null;
            console.log(
                `[removeLineTiles] Removed tile at (${cell.row}, ${cell.col})`,
            );
        }
    });
}

function drawGrid() {
    console.log("[drawGrid] Drawing the grid");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw enhanced grid lines
    drawEnhancedGridLines(ctx, gridSize, tileSize);

    // Draw the tiles
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (grid[row][col] !== null) {
                const x = col * tileSize;
                const y = row * tileSize;

                // Draw tile shadow
                drawTileShadow(
                    ctx,
                    x + 2,
                    y + 2,
                    tileSize - 4,
                    tileSize - 4,
                    15,
                    8,
                );

                // Draw tile with perspective
                drawTileWithPerspective(ctx, x, y, tileSize, tileSize, 4);

                // Draw rounded rectangle
                drawRoundedRect(
                    ctx,
                    x + 2,
                    y + 2,
                    tileSize - 4,
                    tileSize - 4,
                    10,
                );

                // Draw the stone image
                ctx.drawImage(
                    stoneImage,
                    x + 2,
                    y + 2,
                    tileSize - 4,
                    tileSize - 4,
                );

                // Add gradient overlay
                drawTileWithGradient(
                    ctx,
                    x + 2,
                    y + 2,
                    tileSize - 4,
                    tileSize - 4,
                );

                // Add bevel effect
                drawTileBevel(ctx, x + 2, y + 2, tileSize - 4, tileSize - 4);

                // Draw the text
                ctx.fillStyle = "#444";
                ctx.font = `bold ${tileSize / 3}px 'Noto Sans JP', sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                // Text shadow for 3D effect
                ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
                ctx.shadowOffsetX = -1;
                ctx.shadowOffsetY = -1;
                ctx.shadowBlur = 2;
                ctx.fillText(
                    grid[row][col].value,
                    x + tileSize / 2,
                    y + tileSize / 2,
                );

                ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;
                ctx.fillText(
                    grid[row][col].value,
                    x + tileSize / 2,
                    y + tileSize / 2,
                );

                console.log(
                    `[drawGrid] Drew tile with value ${grid[row][col].value} at (${row}, ${col})`,
                );
            }
        }
    }

    // Reset shadow
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function updateScore(points) {
    console.log(`[updateScore] Updating score by ${points} points`);
    score += points;
    document.getElementById("score").textContent = `Score: ${score}`;
    showScoreAnimation(points);

    // Check and update the highest score
    const currentHighScore = localStorage.getItem("highestScore")
        ? parseInt(localStorage.getItem("highestScore"), 10)
        : 0;
    if (score > currentHighScore) {
        localStorage.setItem("highestScore", score);
        document.getElementById("high-score").textContent =
            `Your highest score: ${score}`;
        console.log(`[updateScore] New highest score: ${score}`);
    }
}

function showScoreAnimation(points) {
    console.log(
        `[showScoreAnimation] Showing score animation for ${points} points`,
    );
    const animatedScore = document.createElement("div");
    animatedScore.textContent = `+${points}`;
    animatedScore.className = "animated-score";
    document.body.appendChild(animatedScore);

    const canvasRect = canvas.getBoundingClientRect();
    animatedScore.style.left = `${canvasRect.left + canvasRect.width / 2}px`;
    animatedScore.style.top = `${canvasRect.top + canvasRect.height / 2}px`;

    setTimeout(() => {
        document.body.removeChild(animatedScore);
    }, 2000);
}

function isGameOver() {
    const gameOver = grid.flat().every((cell) => cell !== null);
    console.log(`[isGameOver] Checking if game is over: ${gameOver}`);
    return gameOver;
}

function updateHighestScore(currentScore) {
    console.log(
        `[updateHighestScore] Checking if current score (${currentScore}) is higher than the highest score (${highestScore})`,
    );
    if (currentScore > highestScore) {
        highestScore = currentScore;
        localStorage.setItem("highestScore", highestScore); // Save highest score to localStorage
        document.getElementById("high-score").textContent =
            `Your highest score: ${highestScore}`;
        console.log(`[updateHighestScore] New highest score: ${highestScore}`);
    }
}

if (stoneImage.complete) {
    console.log("[Initialization] Stone image already loaded");
    initializeGrid();
    initializeTiles();
    resizeGame();
} else {
    stoneImage.onload = () => {
        console.log("[Initialization] Stone image loaded");
        initializeGrid();
        initializeTiles();
        resizeGame();
    };
}
