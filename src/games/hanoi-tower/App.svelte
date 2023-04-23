<script lang="ts">
  import { Helpers } from '../../helpers/common';
  import AxisDrawer from './AxisDrawer.svelte';
  import * as Solution from './lib';

  const gui = {
    ringsCount: 3,
    autoSolving: false,
    speed: {
      value: 600,
      min: 0,
      max: 1000,
    },
    darkSchema: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
  };

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    gui.darkSchema = event.matches;
  });

  const game = {
    finalState: Solution.State.createFinal(gui.ringsCount),
    initialState: Solution.State.createClassic(gui.ringsCount),
    state: Solution.State.createClassic(gui.ringsCount),
    selectedAxisIndex: -1,
    stepsCount: 0,
    optimalStepsCount: 0,
    random: false,
    finished: false,
    isAutoUsed: false,
    isOptimalWay: true,
  };

  function startGame(random = false) {
    game.finalState = Solution.State.createFinal(gui.ringsCount);
    game.initialState = random ?
      Solution.State.createRandom(gui.ringsCount) :
      Solution.State.createClassic(gui.ringsCount);
    game.state = game.initialState.clone();
    game.stepsCount = 0;
    game.optimalStepsCount = Solution.Recursive.recGetStepsCount(game.initialState, game.finalState);
    game.selectedAxisIndex = -1;
    game.random = random;
    game.finished = false;
    game.isAutoUsed = false;
    game.isOptimalWay = true;
  }

  let checking = false;
  function checkFinish() {
    if (!game.state.isFinish()) {
      return;
    }

    game.finished = true;
    gui.autoSolving = false;
    
    if (checking) {
      return;
    }
    checking = true;
    setTimeout(() => {
      alert(`You finished with ${game.stepsCount} steps for ${game.state.ringsCount} rings`);
      checking = false;
      ++gui.ringsCount;
      startGame();
    }, 30);
  }

  function tryMakeStep(step: Solution.Step) {
    const result = game.state.tryApplyStep(step);

    if (result) {
      ++game.stepsCount;
    }

    checkFinish();

    return result;
  }

  function onAxisClick(axisIndex: number) {
    if (game.selectedAxisIndex === -1) {
      if (game.state.axes[axisIndex].length) {
        game.selectedAxisIndex = axisIndex;
      }
    } else
    if (game.selectedAxisIndex === axisIndex) {
      game.selectedAxisIndex = -1;
    } else {
      const step = new Solution.Step(game.selectedAxisIndex, axisIndex);
      if (
        game.isOptimalWay &&
        !step.isEquals(Solution.Recursive.recGetStepByStepIndex(game.state, game.finalState, 1))
      ) {
        game.isOptimalWay = false;
      }

      if (tryMakeStep(step)) {
        game.selectedAxisIndex = -1;
      }
    }

    checkFinish();
  }

  const sleeper = new Helpers.SleeperChanging(200);
  function updateSpeed() {
    const {min, max, value} = gui.speed;

    sleeper.duration = Math.trunc(
        max - Math.pow((value - min) / (max - min), 0.25) * (max - min)
    );
  }

  let solving = false;
  async function autoSolve() {
    if (solving) {
      return;
    }
    solving = true;

    while (!game.finished && gui.autoSolving) {
      if (sleeper.duration === 0) {
        game.optimalStepsCount = Solution.Recursive.recGetStepsCount(game.initialState, game.finalState);
        const speed = 0.1 * Solution.Classic.getStepsCountByRingsCount(game.state.ringsCount) / game.state.ringsCount;
        game.stepsCount = Math.trunc(
          Math.min(game.optimalStepsCount, 1 + game.stepsCount + speed),
        );
        game.state = Solution.Recursive.recGetStateByStepIndex(game.initialState, game.finalState, game.stepsCount);
        checkFinish();
        await Helpers.sleep(14);
      } else {
        const step = Solution.Recursive.recGetStepByStepIndex(game.state, game.finalState, 1);
        game.selectedAxisIndex = -1;
        onAxisClick(step.from);
        await sleeper.sleep();
        if (game.finished || !gui.autoSolving) {
          break;
        }
        onAxisClick(step.to);
        await sleeper.sleep();
      }
    }

    solving = false;
  }
  
  function moveNext() {
    const step = Solution.Recursive.recGetStepByStepIndex(game.state, game.finalState, 1);
    if (step) {
      tryMakeStep(step);
    } else {
      checkFinish();
    }
  }

  function movePrev() {
    if (game.stepsCount < 1 || game.optimalStepsCount < game.stepsCount) {
      return;
    }

    --game.stepsCount;
    game.state = Solution.Recursive.recGetStateByStepIndex(game.initialState, game.finalState, game.stepsCount);
  }

  function moveAny(stepIndex: number) {
    game.stepsCount = Math.max(0, Math.min(stepIndex, game.optimalStepsCount));
    game.state = Solution.Recursive.recGetStateByStepIndex(game.initialState, game.finalState, game.stepsCount);
    // checkFinish();
  }

  $: (gui.speed.value + 1) && updateSpeed();
  $: gui.autoSolving && autoSolve();
  $: (gui.ringsCount !== game.state.ringsCount) && startGame();

  // startGame();

  globalThis['game'] = game;
  globalThis['Solution'] = Solution;
</script>

<main>
  <p>
    {#each game.state.axes as axis, i}
      <AxisDrawer
        {axis} axisIndex={i}
        selectedAxisIndex={game.selectedAxisIndex}
        ringsCount={game.state.ringsCount}
        onClick={onAxisClick}
        darkSchema={gui.darkSchema}
      ></AxisDrawer>
    {/each}
  </p>

  <p>Steps: {game.stepsCount} / {game.optimalStepsCount}</p>
  <p>
    <input type="button" value="classic" on:click={() => startGame()}>
    <input type="button" value="random" on:click={() => startGame(true)}>
  </p>
  <p>
    <input type="button" value="-" on:click={movePrev} disabled={!game.isOptimalWay || !game.stepsCount}>
    <input type="range"  value={game.stepsCount} on:input={e => moveAny(+e.target['value'])} min=0 max={game.optimalStepsCount} step=1 disabled={!game.isOptimalWay} style="width: calc(100vw - 160px)">
    <input type="button" value="+" on:click={moveNext}>
  </p>
  <p style="text-align: left">
    <nobr>
      Rings:
      <input type="number" bind:value={gui.ringsCount} min=2 max=50 step=1>
      <input type="range" bind:value={gui.ringsCount} min=2 max=50 step=1 style="width: calc(100vw - 200px)">
    </nobr>
    <br />
    <br />
    <nobr>
      Auto:
      <input type="checkbox" bind:checked={gui.autoSolving}>
    </nobr>
    <br />
    <br />
    <nobr>
      Speed:
      <input type="range" bind:value={gui.speed.value} min={gui.speed.min} max={gui.speed.max} style="width: calc(100vw - 170px)">
    </nobr>
  </p>
</main>

<style>
  input {
    font-size: 14px;
    height: 20px;
    max-width: 400px;
  }

  input[type=checkbox] {
    height: 30px;
    width: 30px;
  }
</style>
