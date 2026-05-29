import "./styles.css";

import { gsap } from "gsap";
import {
  Application,
  Assets,
  Circle,
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  TextStyle
} from "pixi.js";
import manifest from "./data/sprites.manifest.json";
import { STEPS, type GameStepId } from "./data/steps.config";

const DESIGN_WIDTH = 932;
const DESIGN_HEIGHT = 430;
const DPR = Math.min(window.devicePixelRatio || 1, 3);
const ASSET_BASE = (import.meta as any).env?.BASE_URL || "/";

interface SpriteMeta {
  id: string;
  source: string;
  crop: [number, number, number, number];
  anchor: [number, number];
  scale: number;
  hitArea?: [number, number, number];
}

interface GameState {
  step: GameStepId;
  placedItems: number;
  foundCarrots: number;
  isComplete: boolean;
}

interface PlantTarget {
  x: number;
  y: number;
  occupied: boolean;
  glow: Graphics;
}

interface Point {
  x: number;
  y: number;
}

const spritesManifest = manifest as SpriteMeta[];
const spriteMetaById = new Map(spritesManifest.map((item) => [item.id, item]));

const gameRoot = document.querySelector<HTMLDivElement>("#game-root");
const loadingScreen = document.querySelector<HTMLDivElement>("#loading-screen");
const loadingFill = document.querySelector<HTMLDivElement>("#loading-fill");

if (!gameRoot || !loadingScreen || !loadingFill) {
  throw new Error("Missing game DOM nodes.");
}

const gameRootEl = gameRoot;
const loadingScreenEl = loadingScreen;
const loadingFillEl = loadingFill;

const textStyle = new TextStyle({
  fill: "#17443f",
  fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", system-ui, sans-serif',
  fontSize: 24,
  fontWeight: "700",
  letterSpacing: 0,
  stroke: "#fff7bd",
  strokeThickness: 4
});

const smallTextStyle = new TextStyle({
  fill: "#17443f",
  fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", system-ui, sans-serif',
  fontSize: 18,
  fontWeight: "700",
  letterSpacing: 0,
  stroke: "#fff7bd",
  strokeThickness: 3
});

class JulioGardenGame {
  private app: Application<HTMLCanvasElement>;
  private background = new Container();
  private world = new Container();
  private actors = new Container();
  private ui = new Container();
  private effects = new Container();
  private sky = new Graphics();
  private sleepOverlay = new Graphics();
  private promptBubble = new Container();
  private promptBg = new Graphics();
  private promptText = new Text("", smallTextStyle);
  private dragGuide?: Container;
  private dragGuideTimeline?: ReturnType<typeof gsap.timeline>;
  private carrotGuide?: Container;
  private carrotGuideItems: Container[] = [];
  private carrotTargetGlows: Graphics[] = [];
  private waterTargetGlow?: Graphics;
  private waterCan?: Container;
  private waterPourTimeline?: ReturnType<typeof gsap.timeline>;
  private waterPourFallback?: number;
  private waterEffects: Container[] = [];
  private plantedSprites: Container[] = [];
  private sun?: Sprite;
  private julio?: Sprite;
  private julioBaseY = 372;
  private julioReactionTimeline?: ReturnType<typeof gsap.timeline>;
  private titleText?: Text;
  private playButton?: Container;
  private replayButton?: Container;
  private basket?: Sprite;
  private counterText?: Text;
  private plantTargets: PlantTarget[] = [];
  private activeDrag?: {
    sprite: Container;
    startX: number;
    startY: number;
    baseScale: number;
  };
  private activeWaterDrag?: {
    can: Container;
    startX: number;
    startY: number;
    baseScale: number;
    target: Point;
  };

  private state: GameState = {
    step: "intro",
    placedItems: 0,
    foundCarrots: 0,
    isComplete: false
  };

  constructor(app: Application<HTMLCanvasElement>) {
    this.app = app;
    this.effects.eventMode = "none";
    this.effects.interactiveChildren = false;
    this.actors.sortableChildren = true;
    this.app.stage.sortableChildren = true;
    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = new Rectangle(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    this.app.stage.on("pointermove", (event) => this.onGlobalPointerMove(event));
    this.app.stage.on("pointerup", () => {
      this.finishDrag();
      this.finishWaterDrag();
    });
    this.app.stage.on("pointerupoutside", () => {
      this.finishDrag();
      this.finishWaterDrag();
    });
  }

  start() {
    this.ensureAnimationRunning();
    this.app.stage.addChild(this.background, this.world, this.actors, this.effects, this.ui);
    this.buildIntro();
  }

  private buildIntro() {
    this.clearDragGuide();
    this.clearCarrotGuide();
    this.clearCarrotTargetGlows();
    this.clearWaterEffects();
    if (this.waterPourTimeline) {
      this.waterPourTimeline.kill();
      this.waterPourTimeline = undefined;
    }
    if (this.waterPourFallback !== undefined) {
      window.clearTimeout(this.waterPourFallback);
      this.waterPourFallback = undefined;
    }
    this.julioReactionTimeline?.kill();
    this.julioReactionTimeline = undefined;
    gsap.globalTimeline.clear();
    this.ensureAnimationRunning();
    this.state = { step: "intro", placedItems: 0, foundCarrots: 0, isComplete: false };
    this.plantTargets = [];
    this.background.removeChildren();
    this.world.removeChildren();
    this.actors.removeChildren();
    this.effects.removeChildren();
    this.ui.removeChildren();
    this.dragGuide = undefined;
    this.dragGuideTimeline = undefined;
    this.carrotGuide = undefined;
    this.carrotGuideItems = [];
    this.carrotTargetGlows = [];
    this.waterTargetGlow = undefined;
    this.waterCan = undefined;
    this.waterPourTimeline = undefined;
    this.waterPourFallback = undefined;
    this.waterEffects = [];
    this.plantedSprites = [];
    this.julioBaseY = 372;
    this.drawBackground("#94cfe8");
    this.drawClouds();
    this.drawGround();
    this.drawSleepOverlay();
    this.buildPromptBubble();

    const treeHouse = this.makeSprite("tree_house", 158, 385, 0.92);
    const treeCluster = this.makeSprite("tree_cluster", 804, 386, 0.9);
    this.sun = this.makeSprite("sun", 784, 86, 1.0);
    this.julio = this.makeSprite("julio_wave", 290, 372, 1.0);
    this.julioBaseY = this.julio.y;

    this.world.addChild(treeHouse, treeCluster, this.sun);
    this.actors.addChild(this.julio);

    this.makeFloat(this.sun, 9, 2.4, 0.05);
    this.makeFloat(treeCluster, 3, 3.2, -0.015);
    gsap.to(this.julio, {
      duration: 1.1,
      rotation: 0.035,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });

    this.titleText = new Text("Julio's Garden Day", {
      ...textStyle,
      fontSize: 33,
      strokeThickness: 5
    });
    this.titleText.anchor.set(0.5);
    this.titleText.position.set(470, 72);
    this.titleText.rotation = -0.015;
    this.ui.addChild(this.titleText);

    this.playButton = this.makeButton("Play", 470, 326, 142, 58, () => this.startSunStep());
    this.ui.addChild(this.playButton);

    this.setPrompt("");
    this.addSunTapHandler();
  }

  private startSunStep() {
    if (this.state.step !== "intro") return;
    this.ensureAnimationRunning();
    this.state.step = "sun";
    this.playButton?.destroy({ children: true });
    this.playButton = undefined;
    if (this.titleText) {
      const title = this.titleText;
      gsap.to(title, {
        alpha: 0,
        y: title.y - 12,
        duration: 0.24,
        ease: "sine.out",
        onComplete: () => title.destroy()
      });
      this.titleText = undefined;
    }
    this.setPrompt("Tap the sun!", 640, 154, 240);
    this.showSunGlow();
  }

  private awakenGarden() {
    if (this.state.step !== "sun" || !this.sun) return;
    this.ensureAnimationRunning();
    this.state.step = "planting";
    this.setPrompt("Watch the garden wake up!", 466, 128, 360);

    const skyTween = { progress: 0 };
    gsap.to(skyTween, {
      progress: 1,
      duration: 0.9,
      ease: "sine.out",
      onUpdate: () => {
        const progress = skyTween.progress;
        const r = Math.round(0x94 + (0xa8 - 0x94) * progress);
        const g = Math.round(0xcf + (0xe9 - 0xcf) * progress);
        const b = Math.round(0xe8 + (0xf3 - 0xe8) * progress);
        this.drawBackground((r << 16) + (g << 8) + b);
      }
    });

    gsap.to(this.sleepOverlay, {
      alpha: 0,
      duration: 0.65,
      ease: "sine.out"
    });

    gsap.timeline()
      .to(this.sun.scale, {
        x: this.sun.scale.x * 1.18,
        y: this.sun.scale.y * 1.18,
        duration: 0.2,
        ease: "back.out(2.2)"
      })
      .to(this.sun.scale, {
        x: this.sun.scale.x,
        y: this.sun.scale.y,
        duration: 0.26,
        ease: "back.out(2)"
      });

    this.drawSunRays(this.sun.x, this.sun.y);
    this.makeLeafBurst(630, 262, 12);

    window.setTimeout(() => this.startPlantingStep(), 1600);
  }

  private startPlantingStep() {
    this.ensureAnimationRunning();
    this.state.step = "planting";
    this.state.placedItems = 0;
    this.setPrompt("Drag flowers to the glowing spots!", 486, 128, 430);
    const targets: PlantTarget[] = [
      { x: 430, y: 370, occupied: false, glow: this.makeTargetGlow(430, 364) },
      { x: 550, y: 378, occupied: false, glow: this.makeTargetGlow(550, 372) },
      { x: 672, y: 364, occupied: false, glow: this.makeTargetGlow(672, 358) }
    ];
    this.plantTargets = targets;
    targets.forEach((target) => this.effects.addChild(target.glow));

    const tray = this.drawTray();
    tray.zIndex = 2;
    this.actors.addChild(tray);

    const plants = [
      this.makeSprite("flower_pink_bush", 76, 382, 1.55),
      this.makeSprite("flower_pot", 166, 382, 1.05),
      this.makeSprite("flower_pink_bush", 258, 382, 1.35)
    ];

    plants.forEach((plant, index) => {
      plant.eventMode = "static";
      plant.cursor = "grab";
      plant.zIndex = 10 + index;
      const baseScale = plant.scale.x;
      const startX = plant.x;
      const startY = plant.y;
      if (index === 2) {
        plant.rotation = 0.08;
      }
      plant.on("pointerdown", () => {
        if (this.state.step !== "planting" || this.activeDrag) return;
        this.clearDragGuide();
        this.setPrompt("Drop it on a glowing spot!", 486, 128, 360);
        this.activeDrag = { sprite: plant, startX, startY, baseScale };
        plant.cursor = "grabbing";
        plant.zIndex = 30;
        gsap.killTweensOf(plant);
        gsap.to(plant.scale, {
          x: baseScale * 1.12,
          y: baseScale * 1.12,
          duration: 0.12,
          ease: "sine.out"
        });
      });
      plant.on("pointerup", () => this.finishDrag(targets));
      plant.on("pointerupoutside", () => this.finishDrag(targets));
      this.actors.addChild(plant);
      this.makeFloat(plant, 2, 2.5 + index * 0.2, index % 2 ? 0.018 : -0.018);
    });
    this.showDragGuide({ x: 76, y: 330 }, { x: 430, y: 334 }, "flower");
  }

  private finishDrag(targets?: PlantTarget[]) {
    if (!this.activeDrag) return;
    const drag = this.activeDrag;
    const sprite = drag.sprite;
    this.activeDrag = undefined;
    sprite.cursor = "grab";

    const availableTargets = targets ?? this.getPlantTargetsFromEffects();
    const nearest = availableTargets
      .filter((target) => !target.occupied)
      .map((target) => ({
        target,
        distance: Math.hypot(sprite.x - target.x, sprite.y - target.y)
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    if (this.state.step === "planting" && nearest && nearest.distance < 94) {
      nearest.target.occupied = true;
      nearest.target.glow.visible = false;
      sprite.eventMode = "none";
      sprite.zIndex = 14;
      this.state.placedItems += 1;
      this.plantedSprites.push(sprite);
      gsap.timeline()
        .to(sprite, {
          x: nearest.target.x,
          y: nearest.target.y,
          duration: 0.22,
          ease: "sine.out"
        }, 0)
        .to(sprite.scale, {
          x: drag.baseScale * 1.25,
          y: drag.baseScale * 1.25,
          duration: 0.2,
          ease: "back.out(2.4)"
        }, 0)
        .to(sprite.scale, {
          x: drag.baseScale,
          y: drag.baseScale,
          duration: 0.24,
          ease: "back.out(1.8)"
        });
      this.makeLeafBurst(sprite.x, sprite.y - 54, 8);
      this.reactJulio("plant");
      if (this.state.placedItems >= STEPS.find((step) => step.id === "planting")!.required) {
        this.setPrompt("Great! Now water the flowers!", 500, 128, 400);
        window.setTimeout(() => this.startWateringStep(), 700);
      }
    } else {
      gsap.timeline()
        .to(sprite, {
          x: drag.startX,
          y: drag.startY,
          duration: 0.36,
          ease: "back.out(1.8)"
        }, 0)
        .to(sprite.scale, {
          x: drag.baseScale,
          y: drag.baseScale,
          duration: 0.2,
          ease: "sine.out"
        }, 0);
      if (this.state.step === "planting") {
        this.setPrompt("Try a glowing spot!", 486, 128, 330);
        window.setTimeout(() => {
          if (this.state.step === "planting" && !this.activeDrag) {
            const next = availableTargets.find((target) => !target.occupied);
            if (next) {
              this.showDragGuide({ x: drag.startX, y: drag.startY - 52 }, { x: next.x, y: next.y - 36 }, "flower");
            }
          }
        }, 520);
      }
    }
  }

  private onGlobalPointerMove(event: FederatedPointerEvent) {
    const local = event.getLocalPosition(this.actors);
    if (this.activeDrag) {
      this.activeDrag.sprite.position.set(local.x, local.y);
    }
    if (this.activeWaterDrag) {
      this.activeWaterDrag.can.position.set(local.x, local.y);
    }
  }

  private startWateringStep() {
    if (this.state.step !== "planting") return;
    this.ensureAnimationRunning();
    this.state.step = "watering";
    this.setPrompt("Drag the watering can!", 486, 128, 390);

    const target = { x: 552, y: 326 };
    const targetGlow = this.makeTargetGlow(target.x, target.y + 34, 0x9feaf2);
    targetGlow.scale.set(1.4, 1.2);
    this.effects.addChild(targetGlow);
    this.waterTargetGlow = targetGlow;

    const can = this.makeWateringCan();
    can.position.set(116, 336);
    can.zIndex = 35;
    can.eventMode = "static";
    can.cursor = "grab";
    can.hitArea = new Circle(0, 0, 72);
    this.actors.addChild(can);
    this.waterCan = can;
    this.showDragGuide({ x: 116, y: 310 }, { x: target.x, y: target.y }, "water");

    const startX = can.x;
    const startY = can.y;
    const baseScale = can.scale.x;
    can.on("pointerdown", () => {
      if (this.state.step !== "watering" || this.activeWaterDrag) return;
      this.clearDragGuide();
      this.setPrompt("Drop it on the flowers!", 500, 128, 370);
      this.activeWaterDrag = { can, startX, startY, baseScale, target };
      can.cursor = "grabbing";
      gsap.to(can.scale, {
        x: baseScale * 1.08,
        y: baseScale * 1.08,
        duration: 0.12,
        ease: "sine.out"
      });
    });
  }

  private finishWaterDrag() {
    if (!this.activeWaterDrag) return;
    this.ensureAnimationRunning();
    const drag = this.activeWaterDrag;
    const can = drag.can;
    this.activeWaterDrag = undefined;
    can.cursor = "grab";

    const distance = Math.hypot(can.x - drag.target.x, can.y - drag.target.y);
    if (this.state.step === "watering" && distance < 120) {
      this.clearDragGuide();
      this.clearWaterEffects();
      can.eventMode = "none";
      can.cursor = "default";
      const waterGlow = this.waterTargetGlow;
      this.waterTargetGlow = undefined;
      if (waterGlow) {
        gsap.killTweensOf(waterGlow.scale);
        gsap.to(waterGlow, {
          alpha: 0,
          duration: 0.28,
          ease: "sine.out",
          onComplete: () => waterGlow.destroy()
        });
      }
      this.setPrompt("Water the flowers!", 500, 128, 320);
      gsap.killTweensOf(can);
      gsap.killTweensOf(can.scale);
      this.animateWaterCanPour(can, drag);
    } else {
      gsap.timeline()
        .to(can, {
          x: drag.startX,
          y: drag.startY,
          rotation: 0,
          duration: 0.34,
          ease: "back.out(1.8)"
        }, 0)
        .to(can.scale, {
          x: drag.baseScale,
          y: drag.baseScale,
          duration: 0.18,
          ease: "sine.out"
        }, 0);
      this.setPrompt("Try the glowing flowers!", 500, 128, 370);
      window.setTimeout(() => {
        if (this.state.step === "watering" && !this.activeWaterDrag) {
          this.showDragGuide({ x: drag.startX, y: drag.startY - 26 }, { x: drag.target.x, y: drag.target.y }, "water");
        }
      }, 520);
    }
  }

  private startCarrotStep() {
    if (this.state.step !== "watering") return;
    this.state.step = "carrots";
    this.clearDragGuide();
    this.clearCarrotTargetGlows();
    this.clearWaterEffects();
    if (this.waterCan) {
      this.removeWaterCan(this.waterCan);
    }
    if (this.waterTargetGlow) {
      gsap.killTweensOf(this.waterTargetGlow.scale);
      this.waterTargetGlow.destroy();
      this.waterTargetGlow = undefined;
    }
    this.setPrompt("Tap the big carrots!", 506, 128, 340);
    this.state.foundCarrots = 0;

    this.basket = this.makeSprite("carrot_basket", 842, 374, 1.32);
    this.actors.addChild(this.basket);
    this.counterText = new Text("0/3", smallTextStyle);
    this.counterText.anchor.set(0.5);
    this.counterText.position.set(842, 308);
    this.ui.addChild(this.counterText);

    const bushPositions = [
      { x: 420, y: 382, scale: 0.95 },
      { x: 560, y: 380, scale: 0.92 },
      { x: 690, y: 386, scale: 0.74 }
    ];

    bushPositions.forEach((position, index) => {
      const peek = this.makeSprite("carrot_single", position.x + 26, position.y - 116, 1.75);
      peek.rotation = index % 2 === 0 ? -0.28 : 0.22;
      peek.zIndex = 16;
      this.actors.addChild(peek);
      const peekBaseScale = peek.scale.x;
      gsap.to(peek, {
        y: peek.y - 9,
        rotation: peek.rotation + (index % 2 === 0 ? -0.08 : 0.08),
        duration: 0.68,
        delay: index * 0.1,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
      gsap.to(peek.scale, {
        x: peekBaseScale * 1.1,
        y: peekBaseScale * 1.1,
        duration: 0.68,
        delay: index * 0.1,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });

      const bush = this.makeBushPatch(position.x, position.y, position.scale, index);
      bush.eventMode = "static";
      bush.cursor = "pointer";
      bush.zIndex = 18;
      const tapZone = new Container();
      tapZone.position.set(position.x + 26, position.y - 88);
      tapZone.hitArea = new Rectangle(-68, -88, 136, 172);
      tapZone.eventMode = "static";
      tapZone.cursor = "pointer";
      tapZone.zIndex = 46;
      const glow = this.makeTargetGlow(position.x, position.y - 28, 0xfde96c);
      this.effects.addChild(glow);
      this.carrotTargetGlows.push(glow);
      let revealed = false;
      const tapBush = () => {
        if (revealed || this.state.step !== "carrots") return;
        revealed = true;
        bush.eventMode = "none";
        tapZone.eventMode = "none";
        this.removeCarrotGuideAt({ x: position.x + 26, y: position.y - 116 });
        this.removeCarrotTargetGlow(glow);
        gsap.killTweensOf(peek);
        gsap.killTweensOf(peek.scale);
        gsap.to(peek, {
          alpha: 0,
          duration: 0.16,
          ease: "sine.out",
          onComplete: () => peek.destroy()
        });
        this.revealCarrot(position.x, position.y - 94);
        gsap.to(bush.scale, {
          x: bush.scale.x * 1.08,
          y: bush.scale.y * 0.94,
          duration: 0.14,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut"
        });
      };
      bush.on("pointerdown", tapBush);
      bush.on("pointertap", tapBush);
      tapZone.on("pointerdown", tapBush);
      tapZone.on("pointertap", tapBush);
      this.actors.addChild(bush);
      this.actors.addChild(tapZone);
    });
    this.showCarrotGuide(bushPositions.map((position) => ({ x: position.x + 26, y: position.y - 116 })));
  }

  private revealCarrot(x: number, y: number) {
    if (!this.basket) return;
    const carrot = this.makeSprite("carrot_single", x, y, 2.35);
    const flyScale = spriteMetaById.get("carrot_single")!.scale * 1.72;
    carrot.zIndex = 40;
    this.effects.addChild(carrot);
    this.makeLeafBurst(x, y, 5);
    this.reactJulio("carrot");

    this.state.foundCarrots += 1;
    if (this.counterText) {
      this.counterText.text = `${this.state.foundCarrots}/3`;
    }
    const basket = this.basket;
    if (basket) {
      const basketScale = basket.scale.x;
      gsap.timeline()
        .to(basket.scale, {
          x: basketScale * 1.12,
          y: basketScale * 1.12,
          duration: 0.12,
          ease: "back.out(2)"
        })
        .to(basket.scale, {
          x: basketScale,
          y: basketScale,
          duration: 0.18,
          ease: "back.out(1.8)"
        });
    }
    if (this.state.foundCarrots >= STEPS.find((step) => step.id === "carrots")!.required) {
      this.clearCarrotGuide();
      this.clearCarrotTargetGlows();
      window.setTimeout(() => this.startFinale(), 760);
    }

    gsap.timeline({
      onComplete: () => {
        carrot.destroy();
      }
    })
      .to(carrot, {
        x: (x + this.basket.x) / 2,
        y: y - 92,
        rotation: 0.65,
        duration: 0.35,
        ease: "power2.out"
      }, 0)
      .to(carrot.scale, {
        x: carrot.scale.x * 1.12,
        y: carrot.scale.y * 1.12,
        duration: 0.18,
        yoyo: true,
        repeat: 1,
        ease: "back.out(2)"
      }, 0)
      .to(carrot, {
        x: this.basket.x,
        y: this.basket.y - 38,
        rotation: -0.1,
        duration: 0.32,
        ease: "power2.in"
      })
      .to(carrot.scale, {
        x: flyScale,
        y: flyScale,
        duration: 0.32,
        ease: "sine.in"
      }, "<");
  }

  private startFinale() {
    if (this.state.step !== "carrots") return;
    this.state.step = "finale";
    this.state.isComplete = true;
    this.clearCarrotGuide();
    this.clearCarrotTargetGlows();
    this.setPrompt("Garden party!", 466, 128, 260);

    const friends = this.makeSprite("friends_group", 596, 386, 0.95);
    friends.alpha = 0;
    friends.scale.set(friends.scale.x * 0.8);
    this.actors.addChild(friends);

    const celebrate = this.makeSprite("julio_celebrate", 268, 374, 1.04);
    celebrate.alpha = 0;
    celebrate.scale.set(celebrate.scale.x * 0.82);
    this.actors.addChild(celebrate);

    gsap.to([friends, celebrate], {
      alpha: 1,
      duration: 0.35,
      ease: "sine.out",
      stagger: 0.08
    });
    gsap.to(friends.scale, {
      x: spriteMetaById.get("friends_group")!.scale * 0.95,
      y: spriteMetaById.get("friends_group")!.scale * 0.95,
      duration: 0.42,
      ease: "back.out(2)"
    });
    gsap.to(celebrate.scale, {
      x: spriteMetaById.get("julio_celebrate")!.scale * 1.04,
      y: spriteMetaById.get("julio_celebrate")!.scale * 1.04,
      duration: 0.42,
      ease: "back.out(2)"
    });
    gsap.to(celebrate, {
      rotation: 0.055,
      duration: 0.85,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });

    this.makeConfetti();
    this.replayButton = this.makeButton("Play Again", 804, 72, 170, 52, () => this.buildIntro());
    this.ui.addChild(this.replayButton);
  }

  private addSunTapHandler() {
    if (!this.sun) return;
    this.sun.eventMode = "static";
    this.sun.cursor = "pointer";
    this.sun.on("pointerdown", () => this.awakenGarden());
    this.sun.on("pointertap", () => this.awakenGarden());
  }

  private makeSprite(id: string, x: number, y: number, scaleMultiplier = 1) {
    const meta = spriteMetaById.get(id);
    if (!meta) throw new Error(`Missing sprite meta: ${id}`);
    const sprite = Sprite.from(`${ASSET_BASE}assets/sprites/${id}.png`);
    sprite.anchor.set(meta.anchor[0], meta.anchor[1]);
    const scale = meta.scale * scaleMultiplier;
    sprite.scale.set(scale);
    sprite.position.set(x, y);
    if (meta.hitArea) {
      const [hx, hy, hr] = meta.hitArea;
      sprite.hitArea = new Circle(hx, hy, Math.max(hr, 64 / scale));
    }
    return sprite;
  }

  private makeButton(label: string, x: number, y: number, width: number, height: number, onClick: () => void) {
    const button = new Container();
    button.position.set(x, y);
    button.rotation = -0.018;
    button.eventMode = "static";
    button.cursor = "pointer";
    button.hitArea = new Rectangle(-width / 2, -height / 2, width, height);

    const shape = new Graphics();
    shape.lineStyle(3, 0x151515, 1);
    shape.beginFill(0xffe770);
    shape.drawRoundedRect(-width / 2, -height / 2, width, height, 18);
    shape.endFill();
    shape.lineStyle(2, 0xf15b4f, 1);
    shape.moveTo(-width / 2 + 18, height / 2 - 9);
    shape.bezierCurveTo(-20, height / 2 - 2, 38, height / 2 - 14, width / 2 - 18, height / 2 - 7);

    const text = new Text(label, {
      ...smallTextStyle,
      fontSize: label.length > 5 ? 21 : 25,
      strokeThickness: 3
    });
    text.anchor.set(0.5);
    text.position.set(0, 1);
    button.addChild(shape, text);

    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      gsap.to(button.scale, {
        x: 0.94,
        y: 0.94,
        duration: 0.08,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut"
      });
      onClick();
    };
    button.on("pointerdown", fire);
    button.on("pointertap", fire);
    return button;
  }

  private buildPromptBubble() {
    this.promptBubble = new Container();
    this.promptBubble.position.set(466, 132);
    this.promptBg.rotation = 0.012;
    this.promptText.anchor.set(0.5);
    this.promptText.position.set(0, 1);
    this.promptBubble.addChild(this.promptBg, this.promptText);
    this.promptBubble.visible = false;
    this.ui.addChild(this.promptBubble);
  }

  private setPrompt(text: string, x = 466, y = 132, width = 360) {
    if (!this.promptBubble.parent) this.ui.addChild(this.promptBubble);
    this.promptBg.clear();
    this.promptBg.lineStyle(4, 0x151515, 1);
    this.promptBg.beginFill(0xfff1ac, 0.97);
    this.promptBg.drawRoundedRect(-width / 2, -28, width, 56, 20);
    this.promptBg.endFill();
    this.promptBg.lineStyle(2, 0xf15b4f, 1);
    this.promptBg.moveTo(-width / 2 + 24, 17);
    this.promptBg.bezierCurveTo(-60, 28, 80, 12, width / 2 - 28, 19);
    this.promptText.text = text;
    this.promptText.style.fontSize = text.length > 26 ? 18 : 21;
    this.promptBubble.position.set(x, y);
    this.promptBubble.visible = text.length > 0;
    if (text) {
      this.promptBubble.alpha = 0;
      this.promptBubble.scale.set(0.92);
      gsap.to(this.promptBubble, { alpha: 1, duration: 0.22, ease: "sine.out" });
      gsap.to(this.promptBubble.scale, { x: 1, y: 1, duration: 0.28, ease: "back.out(2)" });
    }
  }

  private drawBackground(color: string | number) {
    this.sky.clear();
    const fill = typeof color === "number" ? color : Number(`0x${color.slice(1)}`);
    this.sky.beginFill(fill);
    this.sky.drawRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    this.sky.endFill();
    if (!this.sky.parent) this.background.addChildAt(this.sky, 0);
  }

  private drawClouds() {
    const clouds = [
      { x: 96, y: 82, scale: 0.72, alpha: 0.76, drift: 5, duration: 5.2, rotation: -0.01 },
      { x: 358, y: 34, scale: 0.42, alpha: 0.48, drift: 3, duration: 6.1, rotation: 0.008 },
      { x: 642, y: 42, scale: 0.46, alpha: 0.52, drift: 3, duration: 5.6, rotation: -0.006 }
    ];

    clouds.forEach((config, index) => {
      const cloud = this.makeCloud(index);
      cloud.position.set(config.x, config.y);
      cloud.scale.set(config.scale);
      cloud.alpha = config.alpha;
      this.background.addChild(cloud);
      this.makeFloat(cloud, config.drift, config.duration, config.rotation);
    });
  }

  private makeCloud(variant: number) {
    const cloud = new Container();

    const body = new Graphics();
    body.lineStyle(3, 0x151515, 0.58);
    body.beginFill(0xfffbdf, 0.96);
    body.drawEllipse(-42, 10, 34, 19);
    body.drawEllipse(-16, -2, 31, 25);
    body.drawEllipse(14, -7, 38, 29);
    body.drawEllipse(48, 6, 37, 22);
    body.drawEllipse(8, 14, 70, 17);
    body.endFill();

    const highlight = new Graphics();
    highlight.lineStyle(2, 0xffffff, 0.7);
    highlight.moveTo(-46, 1);
    highlight.bezierCurveTo(-28, -12, -10, -17, 8, -13);
    highlight.moveTo(22, -22);
    highlight.bezierCurveTo(42, -18, 54, -8, 62, 5);

    const smallStroke = new Graphics();
    smallStroke.lineStyle(2, 0x151515, 0.34);
    smallStroke.moveTo(-24, 17);
    smallStroke.bezierCurveTo(-6, 24, 26, 22, 52, 14);

    cloud.addChild(body, highlight, smallStroke);
    cloud.rotation = variant % 2 === 0 ? -0.012 : 0.01;
    return cloud;
  }

  private drawGround() {
    const ground = new Graphics();
    ground.lineStyle(3, 0x151515, 1);
    ground.beginFill(0x7ccc50);
    ground.moveTo(-10, 360);
    ground.bezierCurveTo(145, 324, 260, 362, 390, 340);
    ground.bezierCurveTo(530, 316, 670, 336, 942, 304);
    ground.lineTo(942, 442);
    ground.lineTo(-10, 442);
    ground.lineTo(-10, 360);
    ground.endFill();

    const front = new Graphics();
    front.lineStyle(2, 0x151515, 1);
    front.beginFill(0x42b95a);
    front.moveTo(-8, 390);
    front.bezierCurveTo(150, 370, 314, 406, 472, 376);
    front.bezierCurveTo(624, 350, 762, 384, 940, 354);
    front.lineTo(940, 440);
    front.lineTo(-8, 440);
    front.endFill();

    this.background.addChild(ground, front);
  }

  private drawSleepOverlay() {
    this.sleepOverlay.clear();
    this.sleepOverlay.beginFill(0x5279aa, 0.18);
    this.sleepOverlay.drawRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    this.sleepOverlay.endFill();
    this.sleepOverlay.alpha = 1;
    this.effects.addChild(this.sleepOverlay);
  }

  private showSunGlow() {
    if (!this.sun) return;
    const glow = new Graphics();
    glow.lineStyle(3, 0xf8d852, 0.7);
    glow.beginFill(0xffef83, 0.18);
    glow.drawCircle(0, 0, 78);
    glow.endFill();
    glow.position.set(this.sun.x, this.sun.y);
    this.effects.addChildAt(glow, 0);
    gsap.to(glow.scale, {
      x: 1.18,
      y: 1.18,
      alpha: 0.55,
      duration: 0.85,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
  }

  private drawSunRays(x: number, y: number) {
    const rays = new Graphics();
    rays.lineStyle(5, 0xffd844, 0.9);
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      rays.moveTo(Math.cos(angle) * 55, Math.sin(angle) * 55);
      rays.lineTo(Math.cos(angle) * 96, Math.sin(angle) * 96);
    }
    rays.position.set(x, y);
    rays.alpha = 0;
    this.effects.addChild(rays);
    gsap.timeline({ onComplete: () => rays.destroy() })
      .to(rays, { alpha: 1, duration: 0.16, ease: "sine.out" })
      .to(rays.scale, { x: 1.45, y: 1.45, duration: 0.55, ease: "sine.out" }, 0)
      .to(rays, { alpha: 0, duration: 0.3, ease: "sine.in" }, 0.35);
  }

  private makeTargetGlow(x: number, y: number, color = 0xfff08a) {
    const glow = new Graphics();
    glow.lineStyle(3, 0x151515, 0.32);
    glow.beginFill(color, 0.32);
    glow.drawEllipse(0, 0, 55, 18);
    glow.endFill();
    glow.position.set(x, y);
    gsap.to(glow.scale, {
      x: 1.12,
      y: 1.2,
      duration: 0.85,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    return glow;
  }

  private drawTray() {
    const tray = new Container();
    tray.position.set(158, 392);
    const bg = new Graphics();
    bg.lineStyle(3, 0x151515, 1);
    bg.beginFill(0xffcf67, 0.92);
    bg.drawRoundedRect(-138, -44, 276, 64, 20);
    bg.endFill();
    bg.lineStyle(2, 0xffffff, 0.75);
    for (let x = -114; x <= 110; x += 34) {
      bg.moveTo(x, -35);
      bg.lineTo(x + 12, 9);
    }
    tray.addChild(bg);
    return tray;
  }

  private makeWateringCan() {
    const can = new Container();
    can.scale.set(0.94);

    const handle = new Graphics();
    handle.lineStyle(12, 0x151515, 1);
    handle.moveTo(-36, -6);
    handle.bezierCurveTo(-82, -35, -94, 32, -42, 34);
    handle.lineStyle(6, 0xffc764, 1);
    handle.moveTo(-36, -6);
    handle.bezierCurveTo(-74, -29, -82, 24, -42, 27);

    const spout = new Graphics();
    spout.lineStyle(4, 0x151515, 1);
    spout.beginFill(0x75d8ec, 1);
    spout.moveTo(36, -15);
    spout.bezierCurveTo(68, -34, 101, -33, 121, -17);
    spout.lineTo(115, 2);
    spout.bezierCurveTo(86, -14, 60, -5, 40, 13);
    spout.lineTo(36, -15);
    spout.endFill();
    spout.lineStyle(2, 0xffffff, 0.72);
    spout.moveTo(54, -16);
    spout.bezierCurveTo(76, -25, 96, -24, 111, -15);

    const sprinkler = new Graphics();
    sprinkler.lineStyle(4, 0x151515, 1);
    sprinkler.beginFill(0xffda72, 1);
    sprinkler.drawEllipse(0, 0, 15, 19);
    sprinkler.endFill();
    sprinkler.lineStyle(2, 0xffffff, 0.7);
    sprinkler.drawEllipse(-2, -2, 8, 10);
    sprinkler.beginFill(0x151515, 0.75);
    sprinkler.drawCircle(-4, -6, 2);
    sprinkler.drawCircle(4, -3, 2);
    sprinkler.drawCircle(-1, 5, 2);
    sprinkler.endFill();
    sprinkler.position.set(117, -10);
    sprinkler.rotation = 0.18;

    const body = new Graphics();
    body.lineStyle(4, 0x151515, 1);
    body.beginFill(0x45b9d6, 1);
    body.moveTo(-43, -15);
    body.bezierCurveTo(-27, -35, 24, -34, 40, -14);
    body.lineTo(45, 20);
    body.bezierCurveTo(30, 40, -30, 39, -45, 20);
    body.lineTo(-43, -15);
    body.endFill();
    body.beginFill(0x91e6f1, 1);
    body.drawEllipse(0, -23, 35, 14);
    body.endFill();
    body.lineStyle(3, 0x151515, 0.86);
    body.moveTo(-32, -19);
    body.bezierCurveTo(-16, -10, 19, -11, 34, -20);
    body.lineStyle(2, 0xffffff, 0.82);
    body.moveTo(-26, 15);
    body.bezierCurveTo(-8, 25, 16, 15, 33, 20);
    body.moveTo(-20, -3);
    body.bezierCurveTo(-4, 4, 12, -6, 27, 0);

    const flower = new Graphics();
    flower.lineStyle(2, 0x151515, 0.9);
    flower.beginFill(0xffd84c, 1);
    flower.drawCircle(-9, 3, 6);
    flower.drawCircle(5, 3, 6);
    flower.drawCircle(-2, -8, 6);
    flower.endFill();
    flower.beginFill(0xff7d91, 1);
    flower.drawCircle(-2, 1, 5);
    flower.endFill();
    flower.lineStyle(2, 0x151515, 0.75);
    flower.moveTo(8, 11);
    flower.bezierCurveTo(18, 7, 22, 14, 17, 21);
    flower.position.set(-5, 3);

    can.addChild(handle, spout, sprinkler, body, flower);
    return can;
  }

  private makeWaterDrops(x: number, y: number) {
    const pour = new Container();
    pour.zIndex = 85;
    this.effects.addChild(pour);
    this.waterEffects.push(pour);

    const stream = new Graphics();
    stream.lineStyle(2, 0x151515, 0.16);
    stream.moveTo(-6, -10);
    stream.bezierCurveTo(-10, 24, -4, 72, -18, 112);
    stream.moveTo(14, -5);
    stream.bezierCurveTo(12, 30, 23, 80, 10, 122);
    stream.lineStyle(3, 0x6ed8ef, 0.68);
    stream.moveTo(-6, -10);
    stream.bezierCurveTo(-10, 24, -4, 72, -18, 112);
    stream.moveTo(14, -5);
    stream.bezierCurveTo(12, 30, 23, 80, 10, 122);
    stream.position.set(x, y);
    stream.alpha = 0.74;
    pour.addChild(stream);
    gsap.to(stream, {
      alpha: 0.3,
      duration: 0.18,
      yoyo: true,
      repeat: 5,
      ease: "sine.inOut"
    });

    for (let i = 0; i < 18; i += 1) {
      const drop = new Graphics();
      drop.lineStyle(1.25, 0x151515, 0.28);
      drop.beginFill(0x6ed8ef, 0.78);
      drop.drawEllipse(0, 0, 2.8 + (i % 3) * 0.55, 5.6 + (i % 2) * 1.4);
      drop.endFill();
      drop.position.set(x + Math.random() * 24 - 12, y + Math.random() * 96 - 6);
      drop.rotation = -0.18 + Math.random() * 0.36;
      drop.alpha = 0.78;
      pour.addChild(drop);
      const landX = x - 34 + Math.random() * 92;
      const landY = y + 104 + Math.random() * 22;
      gsap.timeline({ delay: i * 0.026 })
        .to(drop, {
          x: landX,
          y: landY,
          rotation: drop.rotation + 0.5,
          duration: 0.42 + Math.random() * 0.16,
          ease: "sine.in"
        })
        .to(drop.scale, {
          x: 1.28,
          y: 0.68,
          duration: 0.12,
          ease: "sine.out"
        }, ">-0.1")
        .to(drop, {
          alpha: 0,
          duration: 0.26,
          ease: "sine.out"
        });
    }

    for (let i = 0; i < 3; i += 1) {
      const ripple = new Graphics();
      ripple.lineStyle(2, 0x6ed8ef, 0.42);
      ripple.drawEllipse(0, 0, 28 + i * 15, 6 + i * 3);
      ripple.position.set(x + 4 + i * 12, y + 118 + i * 3);
      ripple.alpha = 0.34;
      pour.addChild(ripple);
      gsap.timeline({ delay: 0.28 + i * 0.12 })
        .to(ripple, { alpha: 0.5, duration: 0.12, ease: "sine.out" })
        .to(ripple.scale, { x: 1.28, y: 1.28, duration: 0.5, ease: "sine.out" }, "<")
        .to(ripple, { alpha: 0, duration: 0.3, ease: "sine.in" }, ">-0.2");
    }

    gsap.to(pour, {
      alpha: 0,
      duration: 0.24,
      delay: 1.2,
      ease: "sine.out"
    });
  }

  private animateWaterCanPour(
    can: Container,
    drag: { can: Container; startX: number; startY: number; baseScale: number; target: Point }
  ) {
    this.waterPourTimeline?.kill();
    this.waterPourTimeline = undefined;
    if (this.waterPourFallback !== undefined) {
      window.clearTimeout(this.waterPourFallback);
      this.waterPourFallback = undefined;
    }

    const settle = { x: drag.target.x - 74, y: drag.target.y - 28, rotation: -0.22 };
    const pour = { x: drag.target.x - 84, y: drag.target.y - 16, rotation: -0.88 };
    const exit = { x: drag.target.x - 142, y: drag.target.y + 12, rotation: -0.36 };
    let finished = false;

    const finish = () => {
      if (finished || this.state.step !== "watering") return;
      finished = true;
      this.waterPourTimeline?.kill();
      this.waterPourTimeline = undefined;
      if (this.waterPourFallback !== undefined) {
        window.clearTimeout(this.waterPourFallback);
        this.waterPourFallback = undefined;
      }
      this.removeWaterCan(can);
      this.clearWaterEffects();
      this.setPrompt("Nice! Find the carrots!", 502, 128, 360);
      window.setTimeout(() => this.startCarrotStep(), 120);
    };

    const startPour = () => {
      if (this.state.step !== "watering" || this.waterCan !== can) return;
      this.makeWaterDrops(drag.target.x - 18, drag.target.y - 102);
      this.animateWateredGarden(drag.target);
      this.reactJulio("water");
    };

    this.waterPourTimeline = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: finish
    });

    this.waterPourTimeline
      .to(can, {
        x: settle.x,
        y: settle.y,
        rotation: settle.rotation,
        duration: 0.42,
        ease: "sine.out"
      }, 0)
      .to(can.scale, {
        x: drag.baseScale * 1.03,
        y: drag.baseScale * 1.03,
        duration: 0.22,
        ease: "sine.out"
      }, 0)
      .to(can, {
        x: pour.x,
        y: pour.y,
        rotation: pour.rotation,
        duration: 0.42,
        ease: "sine.inOut"
      }, 0.34)
      .call(startPour, undefined, 0.58)
      .to(can, {
        y: pour.y - 5,
        rotation: pour.rotation - 0.055,
        duration: 0.18,
        yoyo: true,
        repeat: 5,
        ease: "sine.inOut"
      }, 0.78)
      .to(can.scale, {
        x: drag.baseScale,
        y: drag.baseScale,
        duration: 0.2,
        ease: "sine.out"
      }, 0.78)
      .to(can, {
        x: exit.x,
        y: exit.y,
        rotation: exit.rotation,
        alpha: 0,
        duration: 0.48,
        ease: "sine.inOut"
      }, 1.86)
      .to(can.scale, {
        x: drag.baseScale * 0.78,
        y: drag.baseScale * 0.78,
        duration: 0.48,
        ease: "sine.inOut"
      }, 1.86);

    this.waterPourFallback = window.setTimeout(finish, 2700);
  }

  private clearWaterEffects() {
    for (const effect of this.waterEffects) {
      this.killTweensDeep(effect);
      effect.parent?.removeChild(effect);
      effect.destroy({ children: true });
    }
    this.waterEffects = [];
  }

  private animateWateredGarden(target: Point) {
    this.makeLeafBurst(target.x, target.y - 22, 12);
    this.plantedSprites.forEach((sprite, index) => {
      const baseX = sprite.scale.x;
      const baseY = sprite.scale.y;
      gsap.timeline({ delay: index * 0.08 })
        .to(sprite.scale, {
          x: baseX * 1.16,
          y: baseY * 1.16,
          duration: 0.16,
          ease: "back.out(2)"
        })
        .to(sprite.scale, {
          x: baseX,
          y: baseY,
          duration: 0.24,
          ease: "back.out(1.8)"
        });
      gsap.to(sprite, {
        rotation: sprite.rotation + (index % 2 === 0 ? 0.05 : -0.05),
        duration: 0.22,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
        delay: index * 0.08
      });
    });
  }

  private removeWaterCan(can: Container) {
    if ((can as Container & { destroyed?: boolean }).destroyed) return;
    if (this.waterCan === can) {
      this.waterPourTimeline?.kill();
      this.waterPourTimeline = undefined;
      if (this.waterPourFallback !== undefined) {
        window.clearTimeout(this.waterPourFallback);
        this.waterPourFallback = undefined;
      }
    }
    this.killTweensDeep(can);
    can.parent?.removeChild(can);
    can.destroy({ children: true });
    if (this.waterCan === can) {
      this.waterCan = undefined;
    }
  }

  private makeBushPatch(x: number, y: number, scale: number, variant: number) {
    const bush = new Container();
    bush.position.set(x, y);
    bush.scale.set(scale);
    bush.hitArea = new Circle(0, -42, 82);

    const shape = new Graphics();
    shape.lineStyle(4, 0x151515, 1);
    const colors = [0x36b84f, 0x1ea987, 0x85c84d];
    const fill = colors[variant % colors.length];
    shape.beginFill(fill, 1);
    shape.moveTo(-86, -2);
    shape.bezierCurveTo(-88, -52, -58, -72, -28, -54);
    shape.bezierCurveTo(-16, -94, 30, -90, 38, -52);
    shape.bezierCurveTo(74, -72, 104, -42, 82, -2);
    shape.lineTo(74, 5);
    shape.bezierCurveTo(36, 18, -20, 16, -72, 8);
    shape.lineTo(-86, -2);
    shape.endFill();

    const details = new Graphics();
    details.lineStyle(2, 0x151515, 0.55);
    for (let i = 0; i < 5; i += 1) {
      const px = -52 + i * 26 + (variant % 2 ? 8 : 0);
      const py = -34 - (i % 2) * 16;
      details.moveTo(px, py);
      details.bezierCurveTo(px + 5, py - 12, px + 16, py - 10, px + 14, py + 2);
    }

    for (let i = 0; i < 3; i += 1) {
      const flower = new Graphics();
      flower.lineStyle(1.8, 0x151515, 0.8);
      flower.beginFill([0xffd84c, 0xff7d91, 0x9fd8ff][(variant + i) % 3], 1);
      flower.drawCircle(0, 0, 4);
      flower.drawCircle(7, 0, 4);
      flower.drawCircle(3, -6, 4);
      flower.endFill();
      flower.position.set(-46 + i * 44, -50 + (i % 2) * 14);
      bush.addChild(flower);
    }

    bush.addChildAt(shape, 0);
    bush.addChild(details);
    return bush;
  }

  private showDragGuide(from: Point, to: Point, kind: "flower" | "water" = "flower") {
    this.ensureAnimationRunning();
    this.clearDragGuide();
    const guide = new Container();
    guide.zIndex = 80;

    const path = new Graphics();
    path.lineStyle(5, 0xfff1ac, 0.95);
    this.drawDashedLine(path, from.x, from.y, to.x - 34, to.y, 16, 11);
    path.lineStyle(3, 0x151515, 0.55);
    this.drawDashedLine(path, from.x, from.y + 5, to.x - 34, to.y + 5, 16, 12);

    const arrow = new Graphics();
    arrow.lineStyle(3, 0x151515, 0.85);
    arrow.beginFill(0xfff1ac, 0.96);
    arrow.moveTo(0, 0);
    arrow.lineTo(-22, -12);
    arrow.lineTo(-17, 0);
    arrow.lineTo(-22, 12);
    arrow.lineTo(0, 0);
    arrow.endFill();
    arrow.position.set(to.x - 16, to.y);

    const token = this.makeDragGuideToken(kind);
    token.position.set(from.x, from.y);
    token.alpha = 0;
    guide.addChild(path, arrow, token);
    this.effects.addChild(guide);
    this.dragGuide = guide;

    const endX = to.x - 42;
    const endY = to.y - 2;
    const guideState = { progress: 0 };
    const applyToken = () => {
      const p = guideState.progress;
      const eased = 0.5 - Math.cos(p * Math.PI) / 2;
      token.position.set(
        from.x + (endX - from.x) * eased,
        from.y + (endY - from.y) * eased - Math.sin(eased * Math.PI) * 5
      );
      token.rotation = (kind === "water" ? -0.1 : 0.02) + eased * (kind === "water" ? -0.18 : 0.08);
      token.scale.set(1 - Math.max(0, eased - 0.86) * 0.7);
    };
    applyToken();

    this.dragGuideTimeline = gsap.timeline({ repeat: -1, repeatDelay: 0.16 });
    this.dragGuideTimeline
      .to(token, { alpha: 0.92, duration: 0.16, ease: "sine.out" }, 0)
      .to(guideState, {
        progress: 1,
        duration: 1.18,
        ease: "sine.inOut",
        onUpdate: applyToken
      }, 0.12)
      .to(token, { alpha: 0, duration: 0.18, ease: "sine.in" }, 1.22)
      .set(guideState, {
        progress: 0,
        onComplete: applyToken
      });
  }

  private clearDragGuide() {
    this.dragGuideTimeline?.kill();
    this.dragGuideTimeline = undefined;
    if (!this.dragGuide) return;
    this.killTweensDeep(this.dragGuide);
    this.dragGuide.destroy({ children: true });
    this.dragGuide = undefined;
  }

  private showCarrotGuide(points: Point[]) {
    this.clearCarrotGuide();
    const guide = new Container();
    guide.zIndex = 90;
    this.carrotGuideItems = [];

    points.forEach((point, index) => {
      const marker = new Container();
      marker.position.set(point.x, point.y);
      guide.addChild(marker);
      this.carrotGuideItems.push(marker);

      const ring = new Graphics();
      ring.lineStyle(4, 0xfff1ac, 0.95);
      ring.drawCircle(0, 0, 50);
      ring.lineStyle(2, 0x151515, 0.55);
      ring.drawCircle(0, 0, 56);
      ring.alpha = 0.8;
      marker.addChild(ring);
      gsap.to(ring.scale, {
        x: 1.28,
        y: 1.28,
        duration: 0.78,
        delay: index * 0.12,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });

      const sparkle = this.makeTapSparkle();
      sparkle.position.set(28, -28);
      sparkle.alpha = 0.9;
      marker.addChild(sparkle);
      gsap.to(sparkle, {
        y: sparkle.y - 10,
        rotation: sparkle.rotation + 0.28,
        duration: 0.56,
        delay: index * 0.1,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    });

    this.effects.addChild(guide);
    this.carrotGuide = guide;
  }

  private clearCarrotGuide() {
    if (!this.carrotGuide) return;
    this.killTweensDeep(this.carrotGuide);
    this.carrotGuide.destroy({ children: true });
    this.carrotGuide = undefined;
    this.carrotGuideItems = [];
  }

  private removeCarrotGuideAt(point: Point) {
    const marker = this.carrotGuideItems.find((item) => Math.hypot(item.x - point.x, item.y - point.y) < 10);
    if (!marker) return;
    this.carrotGuideItems = this.carrotGuideItems.filter((item) => item !== marker);
    this.killTweensDeep(marker);
    marker.parent?.removeChild(marker);
    marker.destroy({ children: true });
    if (this.carrotGuide && this.carrotGuideItems.length === 0) {
      this.carrotGuide.destroy({ children: true });
      this.carrotGuide = undefined;
    }
  }

  private removeCarrotTargetGlow(glow: Graphics) {
    this.carrotTargetGlows = this.carrotTargetGlows.filter((item) => item !== glow);
    if ((glow as Graphics & { destroyed?: boolean }).destroyed) return;
    gsap.killTweensOf(glow);
    gsap.killTweensOf(glow.scale);
    glow.parent?.removeChild(glow);
    glow.destroy();
  }

  private clearCarrotTargetGlows() {
    const glows = [...this.carrotTargetGlows];
    this.carrotTargetGlows = [];
    glows.forEach((glow) => this.removeCarrotTargetGlow(glow));
  }

  private makeDragGuideToken(kind: "flower" | "water") {
    const token = new Container();
    token.alpha = 0.88;

    const glow = new Graphics();
    glow.lineStyle(3, 0x151515, 0.45);
    glow.beginFill(0xfff1ac, 0.65);
    glow.drawCircle(0, 0, kind === "water" ? 38 : 36);
    glow.endFill();
    token.addChild(glow);

    if (kind === "water") {
      const can = this.makeWateringCan();
      can.scale.set(0.44);
      can.rotation = -0.08;
      can.position.set(-6, 5);
      token.addChild(can);
    } else {
      const flower = this.makeSprite("flower_pink_bush", 0, 18, 1.62);
      flower.alpha = 0.95;
      token.addChild(flower);
    }

    const twinkle = this.makeTapSparkle();
    twinkle.position.set(28, -30);
    twinkle.scale.set(0.82);
    token.addChild(twinkle);
    gsap.to(twinkle, {
      rotation: 0.45,
      duration: 0.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    return token;
  }

  private makeTapSparkle() {
    const sparkle = new Container();
    const star = new Graphics();
    star.lineStyle(3, 0x151515, 0.78);
    star.beginFill(0xffe770, 1);
    star.moveTo(0, -18);
    star.lineTo(6, -6);
    star.lineTo(20, -4);
    star.lineTo(9, 5);
    star.lineTo(12, 18);
    star.lineTo(0, 10);
    star.lineTo(-12, 18);
    star.lineTo(-9, 5);
    star.lineTo(-20, -4);
    star.lineTo(-6, -6);
    star.lineTo(0, -18);
    star.endFill();
    star.lineStyle(2, 0xffffff, 0.8);
    star.moveTo(-5, -6);
    star.lineTo(3, 6);
    sparkle.addChild(star);
    return sparkle;
  }

  private drawDashedLine(
    graphics: Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    dash = 12,
    gap = 8
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const ux = dx / length;
    const uy = dy / length;
    let distance = 0;
    while (distance < length) {
      const start = distance;
      const end = Math.min(distance + dash, length);
      graphics.moveTo(x1 + ux * start, y1 + uy * start);
      graphics.lineTo(x1 + ux * end, y1 + uy * end);
      distance += dash + gap;
    }
  }

  private reactJulio(kind: "plant" | "water" | "carrot") {
    if (!this.julio || this.state.step === "finale") return;
    const julio = this.julio;
    const baseScale = spriteMetaById.get("julio_wave")!.scale;
    const lift = kind === "carrot" ? 15 : kind === "water" ? 12 : 9;
    const stretch = kind === "carrot" ? 1.085 : kind === "water" ? 1.065 : 1.045;
    const squash = kind === "carrot" ? 0.94 : kind === "water" ? 0.955 : 0.97;

    this.julioReactionTimeline?.kill();
    julio.y = this.julioBaseY;
    julio.scale.set(baseScale);
    this.makeJulioSparkles(kind);

    this.julioReactionTimeline = gsap.timeline({
      onComplete: () => {
        julio.y = this.julioBaseY;
        julio.scale.set(baseScale);
        this.julioReactionTimeline = undefined;
      }
    });
    this.julioReactionTimeline
      .to(julio, {
        y: this.julioBaseY - lift,
        duration: 0.13,
        ease: "sine.out"
      }, 0)
      .to(julio.scale, {
        x: baseScale * stretch,
        y: baseScale * squash,
        duration: 0.13,
        ease: "sine.out"
      }, 0)
      .to(julio, {
        y: this.julioBaseY,
        duration: 0.24,
        ease: "back.out(2.4)"
      }, 0.13)
      .to(julio.scale, {
        x: baseScale * 0.985,
        y: baseScale * 1.025,
        duration: 0.12,
        ease: "sine.out"
      }, 0.13)
      .to(julio.scale, {
        x: baseScale,
        y: baseScale,
        duration: 0.16,
        ease: "back.out(1.8)"
      }, 0.25);
  }

  private makeJulioSparkles(kind: "plant" | "water" | "carrot") {
    if (!this.julio) return;
    const root = new Container();
    const count = kind === "plant" ? 2 : 3;
    root.position.set(this.julio.x + 70, this.julioBaseY - 220);
    root.zIndex = 95;
    this.effects.addChild(root);

    const timeline = gsap.timeline({
      onComplete: () => {
        root.parent?.removeChild(root);
        root.destroy({ children: true });
      }
    });

    for (let i = 0; i < count; i += 1) {
      const sparkle = this.makeTapSparkle();
      const startX = -10 + i * 26;
      const startY = i % 2 === 0 ? 8 : -8;
      sparkle.position.set(startX, startY);
      sparkle.scale.set(kind === "plant" ? 0.42 : 0.48);
      sparkle.alpha = 0;
      root.addChild(sparkle);

      const delay = i * 0.06;
      timeline
        .to(sparkle, {
          alpha: 0.95,
          duration: 0.08,
          ease: "sine.out"
        }, delay)
        .to(sparkle, {
          x: startX + 10 + i * 5,
          y: startY - 18 - i * 3,
          rotation: sparkle.rotation + 0.42 + i * 0.08,
          duration: 0.42,
          ease: "sine.out"
        }, delay)
        .to(sparkle.scale, {
          x: sparkle.scale.x * 0.72,
          y: sparkle.scale.y * 0.72,
          duration: 0.24,
          ease: "sine.in"
        }, delay + 0.22)
        .to(sparkle, {
          alpha: 0,
          duration: 0.2,
          ease: "sine.in"
        }, delay + 0.3);
    }
  }

  private makeLeafBurst(x: number, y: number, count: number) {
    for (let i = 0; i < count; i += 1) {
      const leaf = new Graphics();
      const color = [0x52bf45, 0x17a875, 0xffd84c, 0xff7d91][i % 4];
      leaf.lineStyle(2, 0x151515, 0.8);
      leaf.beginFill(color, 0.92);
      leaf.drawEllipse(0, 0, 5 + (i % 3), 10 + (i % 2) * 3);
      leaf.endFill();
      leaf.position.set(x, y);
      leaf.rotation = Math.random() * Math.PI;
      this.effects.addChild(leaf);
      const dx = -54 + Math.random() * 108;
      const dy = -58 - Math.random() * 46;
      gsap.to(leaf, {
        x: x + dx,
        y: y + dy,
        rotation: leaf.rotation + Math.random() * 3,
        alpha: 0,
        duration: 0.72 + Math.random() * 0.28,
        ease: "sine.out",
        onComplete: () => leaf.destroy()
      });
    }
  }

  private makeConfetti() {
    for (let i = 0; i < 28; i += 1) {
      const x = 110 + Math.random() * 720;
      const petal = new Graphics();
      const color = [0xffd84c, 0xf15b4f, 0x7ccc50, 0x00a9c8, 0xff9db2][i % 5];
      petal.lineStyle(2, 0x151515, 0.7);
      petal.beginFill(color, 0.95);
      petal.drawEllipse(0, 0, 5 + Math.random() * 3, 9 + Math.random() * 4);
      petal.endFill();
      petal.position.set(x, -24 - Math.random() * 80);
      petal.rotation = Math.random() * Math.PI;
      this.effects.addChild(petal);
      gsap.to(petal, {
        y: 448,
        x: x + Math.sin(i) * 60,
        rotation: petal.rotation + 4 + Math.random() * 3,
        duration: 2.8 + Math.random() * 1.2,
        delay: Math.random() * 0.5,
        ease: "sine.inOut",
        onComplete: () => petal.destroy()
      });
    }
  }

  private makeFloat(target: Container, distance: number, duration: number, rotation = 0) {
    gsap.to(target, {
      y: target.y - distance,
      rotation,
      duration,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
  }

  private ensureAnimationRunning() {
    if (window.innerWidth >= window.innerHeight) {
      this.app.ticker.start();
      gsap.globalTimeline.resume();
      gsap.ticker.wake();
    }
  }

  private killTweensDeep(target: Container) {
    gsap.killTweensOf(target);
    gsap.killTweensOf(target.scale);
    for (const child of target.children) {
      this.killTweensDeep(child as Container);
    }
  }

  private getPlantTargetsFromEffects(): PlantTarget[] {
    return this.plantTargets;
  }
}

async function preloadAssets() {
  const urls = spritesManifest.map((sprite) => `${ASSET_BASE}assets/sprites/${sprite.id}.png`);
  for (let i = 0; i < urls.length; i += 1) {
    await Assets.load(urls[i]);
    loadingFillEl.style.width = `${Math.round(((i + 1) / urls.length) * 100)}%`;
  }
}

function syncOrientation(app: Application<HTMLCanvasElement>) {
  const portrait = window.innerHeight > window.innerWidth;
  if (portrait) {
    app.ticker.stop();
    gsap.globalTimeline.pause();
  } else {
    app.ticker.start();
    gsap.globalTimeline.resume();
    gsap.ticker.wake();
  }
}

async function bootstrap() {
  const app = new Application<HTMLCanvasElement>({
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    resolution: DPR,
    autoDensity: true,
    antialias: true,
    backgroundAlpha: 0
  });
  app.view.setAttribute("aria-label", "Julio's Garden Day game canvas");
  gameRootEl.appendChild(app.view);

  await preloadAssets();
  loadingScreenEl.classList.add("is-hidden");
  setTimeout(() => loadingScreenEl.remove(), 360);

  const game = new JulioGardenGame(app);
  game.start();
  if ((import.meta as any).env?.DEV) {
    (window as any).__julioGame = game;
  }
  syncOrientation(app);
  window.setTimeout(() => syncOrientation(app), 320);
  window.setTimeout(() => syncOrientation(app), 1000);
  window.addEventListener("resize", () => syncOrientation(app), { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(() => syncOrientation(app), 160), {
    passive: true
  });
}

bootstrap().catch((error) => {
  console.error(error);
  loadingScreenEl.textContent = "Julio needs a moment.";
});
