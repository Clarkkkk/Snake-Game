class Board {
  constructor() {
    this.board = this.constructor.boardElem();
    this.intervalID = 0;
    this.difficulty = [200, 150, 120, 100, 85, 70];
    this.interval = this.difficulty[0];
    this.status = '';
    this.cellSize = 20;
    this.gapSize = 1;
    this.width = (this.board.clientWidth + 1) / (this.cellSize + this.gapSize);
    this.height = (this.board.clientHeight + 1) / (this.cellSize + this.gapSize);
    this.score = 0;
    this.snake = new Snake(Math.floor(this.width / 2), this.height - 5, this.board);
    this.apple = new Apple(Math.floor(this.width / 2), this.height - 10);
    this.sound = {
      eat: new Audio('sound/eat.mp3'),
      crash: new Audio('sound/crash.mp3'),
      speed: new Audio('sound/speed.mp3')
    };
  }

  set score(num) {
    if (num > 0) {
      let fraction = (num - this._score) / 10;
      let id = setInterval(() => {
        this._score += fraction;
        document.querySelector('#scores').innerHTML = '分数<br>' + Math.floor(this._score);
        if (num - this._score < 10) {
          clearInterval(id);
          this._score = num;
          document.querySelector('#scores').innerHTML = '分数<br>' + num;
        }
      }, 40);
    } else {
      this._score = num;
      document.querySelector('#scores').innerHTML = '分数<br>' + num;
    }
  }

  get score() {
    return this._score;
  }

  static boardElem() {
    return document.querySelector('#board');
  }

  init() {
    this.pause();
    this.score = 0;
    this.intervalID = 0;
    this.interval = this.difficulty[0];
    this.status = '';
    document.querySelector('#fail').style.visibility = 'hidden';
    this.snake.init(Math.floor(this.width / 2), this.height - 10);
    this.apple.move(Math.floor(this.width / 2), this.height - 20);
  }

  run() {
    this.intervalID = setInterval(() => {
      this.step();
    }, this.interval);
    this.status = 'running';
  }

  pause() {
    clearInterval(this.intervalID);
    this.status = 'pause';
  }

  fail() {
    this.pause();
    this.status = 'failed';
    createEvents('failed');
  }

  step() {
    const head = this.snake.headXY();
    const nextLocation = { x: head.x + this.snake.dir.x, y: head.y + this.snake.dir.y };
    const obstacle = this.obstacle(nextLocation);
    const result = this.snake.move(this.snake.dir, obstacle);
    if (result) {
      if (this.apple.isEaten) {
        this.sound.eat.stop();
        this.sound.eat.play();
        const random = this.randomApple();
        this.apple.move(random.x, random.y);
        this.score += Math.floor(50000 / this.interval);
        this.speed();
      }
    } else {
      this.fail();
    }
  }

  speed() {
    const accelerate = (newInterval) => {
      clearInterval(this.intervalID);
      this.interval = newInterval;
      this.intervalID = setInterval(() => {
        this.step();
      }, this.interval);
      this.sound.speed.play();
    };

    switch (this.snake.length) {
      case 5:
        accelerate(this.difficulty[1]);
        break;
      case 10:
        accelerate(this.difficulty[2]);
        break;
      case 20:
        accelerate(this.difficulty[3]);
        break;
      case 35:
        accelerate(this.difficulty[4]);
        break;
      case 50:
        accelerate(this.difficulty[5]);
        break;
    }
  }

  divert(direction) {
    if (direction.x !== this.snake.dir.x && direction.y !== this.snake.dir.y) {
      this.snake.dir.x = direction.x;
      this.snake.dir.y = direction.y;
      this.step();
    }
  }

  randomApple() {
    let isSelf = false;
    let random = {};
    do {
      isSelf = false;
      random.x = generateRandom(1, this.width);
      random.y = generateRandom(1, this.height);
      for (const cell of this.snake) {
        if (cell.location.x === random.x && cell.location.y === random.y) {
          isSelf = true;
          break;
        }
      }
    } while (isSelf);
    function generateRandom(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }
    return random;
  }

  obstacle(next) {
    const [appleX, appleY] = [this.apple.location.x, this.apple.location.y];
    if (appleX === next.x && appleY === next.y) {
      return this.apple;
    } else if (next.x <= 0 || next.x > this.width ||
      next.y <= 0 || next.y > this.height) {
      return 'wall';
    } else {
      for (const cell of this.snake) {
        if (cell !== this.snake.tail &&
         cell.location.x === next.x && cell.location.y === next.y) {
          console.log('selg');
          return cell;
        }
      }
      return undefined;
    }
  }
}

class Cell {
  constructor(x, y) {
    this.element = document.createElement('div');
    this.move(x, y);
    this.element.classList.add('cell');
    Board.boardElem().appendChild(this.element);
  }

  move(x, y) {
    this.location = { x: x, y: y };
    this.element.style.gridColumnStart = x;
    this.element.style.gridRowStart = y;
  }
}

class Apple extends Cell {
  constructor(x, y) {
    super(x, y);
    this.isEaten = false;
    this.element.className = 'apple';
  }

  move(x, y) {
    super.move(x, y);
    this.isEaten = false;
  }
}

class Snake {
  constructor(x, y) {
    this.length = 2;
    this.head = new Cell(x, y);
    this.tail = new Cell(x, y + 1);
    this.dir = { x: 0, y: -1 };
    this.whole = [this.head, this.tail];
  }

  headXY() {
    return this.head.location;
  }

  eat(apple) {
    if (apple instanceof Apple) {
      const newHead = new Cell(apple.location.x, apple.location.y);
      this.whole.unshift(newHead);
      this.head = this.whole[0];
      this.length = this.whole.length;
      apple.isEaten = true;
      return true;
    } else {
      return false;
    }
  }

  move(direction, obstacle) {
    this.dir.x = direction.x;
    this.dir.y = direction.y;
    if (obstacle) {
      return this.eat(obstacle);
    } else {
      const location = this.headXY();
      const tail = this.whole.pop();
      tail.move(location.x + direction.x, location.y + direction.y);
      this.whole.unshift(tail);
      this.head = this.whole[0];
      this.tail = this.whole[this.whole.length - 1];
      return true;
    }
  }

  init(x, y) {
    for (const cell of this.whole) {
      cell.element.remove();
    }
    this.length = 2;
    this.head = new Cell(x, y);
    this.tail = new Cell(x, y + 1);
    this.dir = { x: 0, y: -1 };
    this.whole = [this.head, this.tail];
  }

  * [Symbol.iterator]() {
    for (const cell of this.whole) {
      yield cell;
    }
  }
}

class Audio {
  constructor(src, loop = false) {
    this.element = document.createElement('audio');
    this.element.src = src;
    this.element.loop = loop;
  }

  play() {
    if (!this.constructor.disabled) {
      this.element.play();
    }
  }

  stop() {
    this.element.pause();
    this.element.currentTime = 0;
  }

  addEventListener(eventName, handler) {
    this.element.addEventListener(eventName, handler);
  }
}
Audio.disabled = false;

class Control {
  constructor(elemSelector, clickHandler) {
    this.element = document.querySelector(elemSelector);
    this.handler = clickHandler;
    this._sound = new Audio('sound/click.mp3');
    this._soundHandler = () => {
      this._sound.stop();
      this._sound.play();
    };
    this.enable();
  }

  get classList() {
    return this.element.classList;
  }

  disable() {
    this.element.removeEventListener('click', this._soundHandler);
    this.element.removeEventListener('click', this.handler);
    this.element.classList.add('disabled');
  }

  enable() {
    this.element.addEventListener('click', this._soundHandler);
    this.element.addEventListener('click', this.handler);
    this.element.classList.remove('disabled');
  }
}

function createEvents(type, detail) {
  const event = new CustomEvent(type, {
    detail: detail,
    bubbles: true
  });
  document.querySelector('#start').dispatchEvent(event);
}

function run(status) {
  const start = new Control('#start', clickStart);
  const restart = new Control('#restart', clickRestart);
  const soundControl = new Control('#sound-control', clickSoundControl);

  const failDiv = document.querySelector('#fail');
  const body = document.documentElement;

  const board = new Board(document.querySelector('main'));
  const bgm = new Audio('sound/sewer-funk.mp3', true);
  const failSound = new Audio('sound/fail.mp3');

  body.addEventListener('failed', () => {
    start.disable();
    bgm.stop();
    failSound.play();
    failDiv.style.visibility = 'visible';
    failDiv.querySelector('div').innerHTML = board.score;
  });

  function clickStart(event) {
    bgm.play();
    if (board.status !== 'running') {
      board.run();
      body.addEventListener('keyup', divert);
      event.target.innerHTML = '暂停';
      board.status = 'running';
      restart.enable();
    } else {
      board.pause();
      body.removeEventListener('keyup', divert);
      event.target.innerHTML = '继续';
      board.status = 'pause';
    }
  }

  function clickRestart(event) {
    board.init();
    start.enable();
    failSound.stop();
    bgm.play();
    document.querySelector('#start').innerHTML = '开始';
    board.status = '';
    setTimeout(() => restart.disable(), 10);
  }

  function clickSoundControl(event) {
    if (!Audio.disabled) {
      event.target.innerHTML = '声音：关';
      Audio.disabled = true;
      bgm.stop();
    } else {
      event.target.innerHTML = '声音：开';
      Audio.disabled = false;
      bgm.play();
    }
  }

  function divert(event) {
    if (board.status === 'failed') {
      body.removeEventListener('keyup', divert);
      return;
    }
    switch (event.key) {
      case 'ArrowUp':
        board.divert({x: 0, y: -1});
        break;
      case 'ArrowDown':
        board.divert({x: 0, y: 1});
        break;
      case 'ArrowLeft':
        board.divert({x: -1, y: 0});
        break;
      case 'ArrowRight':
        board.divert({x: 1, y: 0});
        break;
    }
  }
}

window.onload = run;
