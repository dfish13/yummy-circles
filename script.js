const canvas = document.querySelector('.myCanvas');
const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight - 85;
const ctx = canvas.getContext('2d');

ctx.fillStyle = 'rgb(0,0,0)';
ctx.fillRect(0, 0, width, height);

const colorPicker = document.querySelector('input[type="color"]');
const sizePicker = document.querySelector('input[type="range"]');
const output = document.querySelector('.output');
const clearBtn = document.getElementById('clearButton');
const startBtn = document.getElementById('startButton');
const ballCount = document.querySelector('.ballCount');

// covert degrees to radians
function degToRad(degrees) {
  return degrees * Math.PI / 180;
};

// update sizepicker output value

sizePicker.addEventListener('input', () => output.textContent = sizePicker.value);

// store mouse pointer coordinates, and whether the button is pressed
let curX;
let curY;
let balls = [];
let interval;
let shift = 130;
const rect = canvas.getBoundingClientRect();

// update mouse pointer coordinates
document.addEventListener('mousedown', e => {
  curX = (window.Event) ? e.pageX : e.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
  curY = (window.Event) ? e.pageY : e.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
  let ball = new Ball(curX, curY, colorPicker.value, sizePicker.value);
  balls.push(ball);
  ball.draw(ctx);
  ballCount.textContent = balls.length;
});

addEventListener('keydown', (event) => {
  if (event.key = 'd') {
    console.log(event.key);
  }
});

clearBtn.addEventListener('click', () => {
  clearFrame();
  balls.length = 0;
});

function clearFrame() {
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(0, 0, width, height);
}


function detectBallCollision(ball1, ball2) {
  let distance = Math.sqrt((ball1.curX - ball2.curX) ** 2 + (ball1.curY - ball2.curY) ** 2)
  if (distance <= (ball1.size + ball2.size)) {
    return true
  } else {
    return false
  }
}

function animationFrame() {
  clearFrame();

  // Set of balls that were involved in a collision so that we don't let more than 2 balls collide in one step.
  let collidedBalls = new Set();

  // Compute the new balls that we get from collisions.
  let newBalls = [];
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      if (collidedBalls.has(i) || collidedBalls.has(j)) {
        continue;
      }
      if (detectBallCollision(balls[i], balls[j])) {
        let a1 = balls[i].size ** 2;
        let a2 = balls[j].size ** 2;
        let newColor = combineColors(balls[i].color, balls[j].color, a1, a2);
        let b = (balls[i].size >= balls[j].size) ? i : j;
        let newSize = Math.sqrt((balls[i].size ** 2) + (balls[j].size ** 2))
        balls[b].color = newColor;
        balls[b].size = newSize;
        newBalls.push(balls[b]);
        collidedBalls.add(i);
        collidedBalls.add(j);
        break;
      }
    }
  }

  // Add back the balls that didn't collide with anything.
  for (let i = 0; i < balls.length; i++) {
    if (!collidedBalls.has(i)) {
      newBalls.push(balls[i]);
    }
  }

  // Finally, set balls to be the newly computed ball list.
  balls = newBalls;
  for (i in balls) {
    balls[i].step();
    balls[i].draw(ctx);
  }
}

startBtn.addEventListener('click', () => {
  if (!interval) {
    interval = setInterval(animationFrame, 10);
    startBtn.textContent = 'Stop'
  } else {
    clearInterval(interval);
    interval = undefined;
    startBtn.textContent = 'Start'
  }
});

function drawBall() {
  ctx.fillStyle = colorPicker.value;
  ctx.beginPath();
  ctx.arc(curX, curY - shift, sizePicker.value, degToRad(0), degToRad(360), false);
  ctx.fill();
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getVelocityComponent() {
  return rand(-5, 5);
}

function combineColors(c1, c2, a1, a2) {

  return new Color(
    Math.round((a1 * c1.red + a2 * c2.red) / (a1 + a2)),
    Math.round((a1 * c1.green + a2 * c2.green) / (a1 + a2)),
    Math.round((a1 * c1.blue + a2 * c2.blue) / (a1 + a2)));
}

class Color {

  static parseHexString(hexString) {
    return new Color(
      parseInt(hexString.substr(1, 2), 16),
      parseInt(hexString.substr(3, 2), 16),
      parseInt(hexString.substr(5, 2), 16));
  }

  constructor(r, g, b) {
    this.red = r;
    this.green = g;
    this.blue = b;
  }

  toHexString() {
    return '#' +
      Math.round(this.red).toString(16).padStart(2, '0').toUpperCase() +
      Math.round(this.green).toString(16).padStart(2, '0').toUpperCase() +
      Math.round(this.blue).toString(16).padStart(2, '0').toUpperCase();
  }
}

class Ball {

  constructor(x, y, fill, size) {
    this.curX = x;
    this.curY = y;
    this.color = Color.parseHexString(fill);
    this.size = parseFloat(size);
    this.vX = getVelocityComponent();
    this.vY = getVelocityComponent();
  }

  draw() {
    ctx.fillStyle = this.color.toHexString();
    ctx.beginPath();
    ctx.arc(this.curX, this.curY - shift, this.size, degToRad(0), degToRad(360), false);
    ctx.fill();
  }

  step() {
    this.handleWallCollision();
    this.curX += this.vX;
    this.curY += this.vY;
  }

  handleWallCollision() {
    if (this.curX <= 0)
      this.vX = -this.vX;
    if (this.curY <= shift)
      this.vY = -this.vY;

    if (this.curX >= rect.right)
      this.vX = -this.vX;
    if (this.curY >= rect.bottom)
      this.vY = -this.vY;

  }


}