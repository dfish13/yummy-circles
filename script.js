const canvas = document.querySelector('.myCanvas');
const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight - 85;
const ctx = canvas.getContext('2d');

ctx.fillStyle = 'rgb(0,0,0)';
ctx.fillRect(0, 0, width, height);

const colorPicker = document.querySelector('input[type="color"]');
const radiusPicker = document.querySelector('input[type="range"]');
const output = document.querySelector('.output');
const clearBtn = document.getElementById('clearButton');
const startBtn = document.getElementById('startButton');
const sprayBtn = document.getElementById('spray');
const shootBtn = document.getElementById('shoot');

// covert degrees to radians
function degToRad(degrees) {
  return degrees * Math.PI / 180;
};

// update radiuspicker output value

radiusPicker.addEventListener('input', () => output.textContent = radiusPicker.value);

sprayBtn.addEventListener('input', () => {
  tool = 1;
});
shootBtn.addEventListener('input', () => {
  tool = 0;
});

// store mouse pointer coordinates, and whether the button is pressed
let curX;
let curY;


let balls = [];
let flowIntervalId;
let interval;
let shift = 100;
const rect = canvas.getBoundingClientRect();

// state for the Tool
// 0 = shoot
// 1 = spray
let tool = 1;
let startPos;
let endPos;


// List of parameters for the simulation

// In a collision, balls can either bounce off eachother or squish together.
// This is the probability that the balls squish instead of bouncing.
const squishProbability = 0.1;

function addBall() {
  let r = Vector2d.rand(10);
  let ball = new Ball(curX + r.x, curY + r.y, colorPicker.value, radiusPicker.value);
  balls.push(ball);
  ball.draw(ctx);
}

function addBallAtPosition(pos, v) {
  let r = Vector2d.rand(10);
  let ball = new Ball(pos.x + r.x, pos.y + r.y, colorPicker.value, radiusPicker.value);
  ball.v = v;
  balls.push(ball);
  ball.draw(ctx);
}

canvas.addEventListener('mousedown', e => {
  // update mouse pointer coordinates
  curX = (window.Event) ? e.pageX : e.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
  curY = (window.Event) ? e.pageY : e.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
  if (tool == 1) {
    addBall();
    if (!flowIntervalId) {
      flowIntervalId = setInterval(() => {
        addBall()
      }, 20);
    }
  } else if (tool == 0) {
    startPos = new Vector2d(curX, curY);
  }

});

canvas.addEventListener('mouseup', e => {
  if (tool == 1) {
    if (flowIntervalId) {
      clearInterval(flowIntervalId);
    }
    flowIntervalId = undefined;
  } else if (tool == 0) {
    endPos = new Vector2d(curX, curY);
    v = Vector2d.difference(startPos, endPos).multiply(0.1);
    addBallAtPosition(startPos, v);
  }
})

canvas.addEventListener('mousemove', e => {
  curX = (window.Event) ? e.pageX : e.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
  curY = (window.Event) ? e.pageY : e.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
})

// Demonstrate keydown events. No real function at the moment.
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
  let distance = ball1.pos.distance(ball2.pos);
  if (distance <= (ball1.radius + ball2.radius)) {
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
        let ball1 = balls[i];
        let ball2 = balls[j];
        let totalMass = ball1.mass() + ball2.mass();
        collidedBalls.add(i);
        collidedBalls.add(j);

        // Balls squish together
        if (Math.random() < squishProbability) {
          let newColor = combineColors(balls[i], balls[j]);
          let b = (balls[i].radius >= balls[j].radius) ? i : j;
          let newRadius = Math.sqrt(totalMass);
          balls[b].color = newColor;
          balls[b].radius = newRadius;
          balls[b].v = collisionResultVelocity(balls[i], balls[j]);
          newBalls.push(balls[b]);
          break;
        }

        // Balls bounce off eachother in a perfectly elastic collision
        else {
          let normal = Vector2d.difference(ball1.pos, ball2.pos);
          normal.normalize();
          let tangential = new Vector2d(-normal.y, normal.x);
          let ball1ScalarNormal = normal.dot(ball1.v);
          let ball2ScalarNormal = normal.dot(ball2.v);
          let ball1ScalarTangential = tangential.dot(ball1.v);
          let ball2ScalarTangential = tangential.dot(ball2.v);
          let newBall1ScalarNormal = (ball1ScalarNormal * (ball1.mass() - ball2.mass()) + 2 * ball2.mass() * ball2ScalarNormal) / totalMass;
          let newBall2ScalarNormal = (ball2ScalarNormal * (ball2.mass() - ball1.mass()) + 2 * ball1.mass() * ball1ScalarNormal) / totalMass;
          let newBall1Velocity = tangential.multiply(ball1ScalarTangential).add(normal.multiply(newBall1ScalarNormal));
          let newBall2Velocity = tangential.multiply(ball2ScalarTangential).add(normal.multiply(newBall2ScalarNormal));

          ball1.v = newBall1Velocity;
          ball2.v = newBall2Velocity;
          newBalls.push(ball1);
          newBalls.push(ball2);
        }

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
  ctx.arc(curX, curY - shift, radiusPicker.value, degToRad(0), degToRad(360), false);
  ctx.fill();
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function combineColors(b1, b2) {
  let a1 = b1.mass();
  let a2 = b2.mass();
  return new Color(
    Math.round((a1 * b1.color.red + a2 * b2.color.red) / (a1 + a2)),
    Math.round((a1 * b1.color.green + a2 * b2.color.green) / (a1 + a2)),
    Math.round((a1 * b1.color.blue + a2 * b2.color.blue) / (a1 + a2)));
}

function collisionResultVelocity(b1, b2) {
  let a1 = b1.radius ** 2;
  let a2 = b2.radius ** 2;
  return new Vector2d(
    (b1.v.x * a1 + b2.v.x * a2) / (a1 + a2),
    (b1.v.y * a1 + b2.v.y * a2) / (a1 + a2))
}

class Vector2d {

  constructor(x, y) {
    this.x = x;
    this.y = y
  }

  static rand(m) {
    let k = m * Math.random();
    let t = 2 * Math.random() * Math.PI;
    return new Vector2d(k * Math.cos(t), k * Math.sin(t));
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  normalize() {
    let m = Math.sqrt(this.x ** 2 + this.y ** 2);
    this.x = this.x / m;
    this.y = this.y / m;
  }

  add(v) {
    return new Vector2d(this.x + v.x, this.y + v.y);
  }

  distance(v) {
    return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2)
  }

  subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
  }

  multiply(a) {
    return new Vector2d(this.x * a, this.y * a);
  }

  static difference(a, b) {
    return new Vector2d(a.x - b.x, a.y - b.y);
  }
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

  constructor(x, y, fill, radius) {
    this.pos = new Vector2d(x, y);
    this.color = Color.parseHexString(fill);
    this.radius = parseFloat(radius);
    this.v = Vector2d.rand(5);
  }

  draw() {
    ctx.fillStyle = this.color.toHexString();
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y - shift, this.radius, degToRad(0), degToRad(360), false);
    ctx.fill();
  }

  step() {
    this.handleWallCollision();
    this.pos = this.pos.add(this.v);
  }

  mass() {
    return this.radius ** 2;
  }

  handleWallCollision() {
    // left wall
    if (this.pos.x - this.radius <= 0 && this.v.x < 0)
      this.v.x = -this.v.x;
    // ceiling
    if (this.pos.y - this.radius <= shift && this.v.y < 0)
      this.v.y = -this.v.y;
    // right wall
    if (this.pos.x + this.radius >= rect.right && this.v.x > 0)
      this.v.x = -this.v.x;
    // floor
    if (this.pos.y + this.radius >= rect.bottom && this.v.y > 0)
      this.v.y = -this.v.y;
  }

}