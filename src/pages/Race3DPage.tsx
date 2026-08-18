import { useEffect, useRef } from "react";
import * as THREE from "three";

type HorseRig = {
  group: THREE.Group;
  body: THREE.Mesh;
  head: THREE.Mesh;
  jockey: THREE.Group;
  legs: THREE.Mesh[];
  number: number;
  lane: number;
  speedSeed: number;
  phase: number;
};


const JOCKEY_COLORS = [
  0xffffff,
  0x222222,
  0xe53935,
  0x2869d8,
  0xf2cf24,
  0x2ea84f,
  0xf28a25,
  0xe96ba8,
  0x7958c8,
  0x20a7a0,
  0xa86535,
];

function Race3DPage() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ccef);
    scene.fog = new THREE.Fog(0xb9dbe8, 45, 150);

    const camera = new THREE.PerspectiveCamera(
      43,
      mount.clientWidth / mount.clientHeight,
      0.1,
      300
    );

    camera.position.set(-14, 9, 20);
    camera.lookAt(7, 2.2, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
      mount.clientWidth,
      mount.clientHeight
    );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.appendChild(renderer.domElement);

    const hemisphereLight = new THREE.HemisphereLight(
      0xffffff,
      0x355c30,
      2.3
    );

    scene.add(hemisphereLight);

    const sun = new THREE.DirectionalLight(
      0xffffff,
      2.7
    );

    sun.position.set(-20, 35, 15);
    sun.castShadow = true;

    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;

    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;

    scene.add(sun);

    const trackMaterial = new THREE.MeshStandardMaterial({
      color: 0x3f963f,
      roughness: 1,
    });

    const track = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 42),
      trackMaterial
    );

    track.rotation.x = -Math.PI / 2;
    track.position.set(70, 0, 0);
    track.receiveShadow = true;

    scene.add(track);

    // 芝のストライプ
    for (let i = -8; i < 40; i += 1) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(4.5, 42),
        new THREE.MeshBasicMaterial({
          color:
            i % 2 === 0
              ? 0x4ca04a
              : 0x3d8e3d,
        })
      );

      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(i * 5, 0.012, 0);

      scene.add(stripe);
    }

    // 内ラチ
    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.65,
    });

    const upperRail = new THREE.Mesh(
      new THREE.BoxGeometry(260, 0.18, 0.18),
      railMaterial
    );

    upperRail.position.set(70, 1.25, -15.2);
    upperRail.castShadow = true;

    scene.add(upperRail);

    for (let x = -50; x < 190; x += 4.5) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 1.25, 0.15),
        railMaterial
      );

      post.position.set(x, 0.63, -15.2);
      post.rotation.z = -0.13;

      scene.add(post);
    }

    // 観客席
    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(230, 8, 12),
      new THREE.MeshStandardMaterial({
        color: 0x8d989f,
        roughness: 0.9,
      })
    );

    stand.position.set(65, 4, -25);
    scene.add(stand);

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(230, 0.7, 15),
      new THREE.MeshStandardMaterial({
        color: 0x45525b,
      })
    );

    roof.position.set(65, 9, -25);
    scene.add(roof);

    // 観客っぽい色の点
    const crowdColors = [
      0xd84343,
      0x2464a8,
      0xe2b52e,
      0x3e884e,
      0x82539d,
      0xee8033,
      0xf1f1f1,
    ];

    for (let x = -45; x < 175; x += 2) {
      for (let row = 0; row < 4; row += 1) {
        const person = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 8, 8),
          new THREE.MeshBasicMaterial({
            color:
              crowdColors[
                (Math.floor(x) + row * 3 + 1000) %
                  crowdColors.length
              ],
          })
        );

        person.position.set(
          x,
          2.2 + row * 1.25,
          -18.8 - row * 1.15
        );

        scene.add(person);
      }
    }

    function createHorse(
      number: number,
      lane: number
    ): HorseRig {
      const group = new THREE.Group();

      const horseMaterial = new THREE.MeshStandardMaterial({
        color:
          number % 4 === 0
            ? 0x3d2418
            : number % 3 === 0
              ? 0x8a5332
              : 0x68402b,
        roughness: 0.8,
      });

      const darkMaterial = new THREE.MeshStandardMaterial({
        color: 0x24160f,
        roughness: 0.9,
      });

      const body = new THREE.Mesh(
        new THREE.SphereGeometry(1, 20, 14),
        horseMaterial
      );

      body.scale.set(1.65, 0.82, 0.65);
      body.position.y = 1.85;
      body.castShadow = true;

      group.add(body);

      const chest = new THREE.Mesh(
        new THREE.SphereGeometry(0.72, 16, 12),
        horseMaterial
      );

      chest.scale.set(0.9, 1.15, 0.85);
      chest.position.set(1.15, 2.02, 0);
      chest.rotation.z = -0.25;
      chest.castShadow = true;

      group.add(chest);

      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.38,
          0.56,
          1.8,
          12
        ),
        horseMaterial
      );

      neck.position.set(1.55, 2.82, 0);
      neck.rotation.z = -0.58;
      neck.castShadow = true;

      group.add(neck);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.52, 16, 12),
        horseMaterial
      );

      head.scale.set(1.3, 0.8, 0.78);
      head.position.set(2.15, 3.45, 0);
      head.rotation.z = -0.16;
      head.castShadow = true;

      group.add(head);

      const muzzle = new THREE.Mesh(
        new THREE.SphereGeometry(0.34, 12, 10),
        darkMaterial
      );

      muzzle.scale.set(1.3, 0.7, 0.8);
      muzzle.position.set(2.62, 3.32, 0);

      group.add(muzzle);

      // 耳
      [-0.22, 0.22].forEach((z) => {
        const ear = new THREE.Mesh(
          new THREE.ConeGeometry(0.14, 0.55, 8),
          horseMaterial
        );

        ear.position.set(1.95, 4.02, z);
        ear.rotation.z = -0.12;

        group.add(ear);
      });

      // 尻尾
      const tail = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.12,
          0.04,
          1.5,
          8
        ),
        darkMaterial
      );

      tail.position.set(-1.75, 1.95, 0);
      tail.rotation.z = -1.0;

      group.add(tail);

      const legs: THREE.Mesh[] = [];

      const legPositions = [
        [-0.95, 0.15],
        [-0.55, -0.22],
        [0.75, 0.16],
        [1.05, -0.2],
      ];

      legPositions.forEach(([x, z]) => {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.12,
            0.09,
            1.8,
            9
          ),
          darkMaterial
        );

        leg.position.set(x, 0.8, z);
        leg.castShadow = true;

        group.add(leg);
        legs.push(leg);
      });

      // 鞍
      const saddle = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.18, 0.9),
        new THREE.MeshStandardMaterial({
          color: JOCKEY_COLORS[number - 1],
        })
      );

      saddle.position.set(-0.05, 2.55, 0);
      saddle.rotation.z = -0.05;

      group.add(saddle);

      // 騎手
      const jockey = new THREE.Group();

      const jerseyMaterial =
        new THREE.MeshStandardMaterial({
          color: JOCKEY_COLORS[number - 1],
          roughness: 0.7,
        });

      const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.32,
          0.42,
          1.05,
          12
        ),
        jerseyMaterial
      );

      torso.rotation.z = -0.6;
      torso.position.set(0.25, 3.15, 0);

      jockey.add(torso);

      const face = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 10),
        new THREE.MeshStandardMaterial({
          color: 0xe4a978,
        })
      );

      face.position.set(0.72, 3.67, 0);

      jockey.add(face);

      const helmet = new THREE.Mesh(
        new THREE.SphereGeometry(0.31, 12, 10),
        jerseyMaterial
      );

      helmet.scale.y = 0.65;
      helmet.position.set(0.69, 3.87, 0);

      jockey.add(helmet);

      group.add(jockey);

      // ゼッケン
      const numberCanvas =
        document.createElement("canvas");

      numberCanvas.width = 128;
      numberCanvas.height = 128;

      const numberCtx =
        numberCanvas.getContext("2d");

      if (numberCtx) {
        numberCtx.fillStyle = "#ffffff";
        numberCtx.fillRect(0, 0, 128, 128);

        numberCtx.fillStyle = "#111111";
        numberCtx.font = "bold 78px sans-serif";
        numberCtx.textAlign = "center";
        numberCtx.textBaseline = "middle";

        numberCtx.fillText(
          String(number),
          64,
          68
        );
      }

      const texture =
        new THREE.CanvasTexture(numberCanvas);

      const numberPlate = new THREE.Mesh(
        new THREE.PlaneGeometry(0.75, 0.75),
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: false,
        })
      );

      numberPlate.position.set(
        -0.15,
        2.05,
        0.66
      );

      numberPlate.rotation.y = 0;

      group.add(numberPlate);

      group.position.set(
        -6 - Math.floor(number / 4) * 1.5,
        0,
        lane
      );

      scene.add(group);

      return {
        group,
        body,
        head,
        jockey,
        legs,
        number,
        lane,
        speedSeed:
          0.85 +
          ((number * 37) % 100) / 1000,
        phase:
          number * 0.83,
      };
    }

    const lanePositions = [
      -8.5,
      -6.8,
      -5.1,
      -3.4,
      -1.7,
      0,
      1.7,
      3.4,
      5.1,
      6.8,
      8.5,
    ];

    const horses: HorseRig[] =
      lanePositions.map((lane, index) =>
        createHorse(index + 1, lane)
      );

    // ゴール板
    const finishPostMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
      });

    const finishPost = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 7, 0.35),
      finishPostMaterial
    );

    finishPost.position.set(105, 3.5, -13);
    scene.add(finishPost);

    const finishTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.45, 26),
      finishPostMaterial
    );

    finishTop.position.set(105, 6.8, 0);
    scene.add(finishTop);

    const clock = new THREE.Clock();

    let cameraX = -14;
    let animationFrame = 0;

    const animate = () => {
      animationFrame =
        requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      let leaderX = -1000;

      horses.forEach((horse) => {
        const baseSpeed =
          1.05 * horse.speedSeed;

        const surge =
          Math.sin(
            elapsed * 0.42 +
              horse.phase
          ) *
            0.13 +
          Math.sin(
            elapsed * 0.17 +
              horse.phase * 2
          ) *
            0.09;

        const speed =
          Math.max(
            0.75,
            baseSpeed + surge
          );

        horse.group.position.x +=
          speed * 0.025;

        leaderX = Math.max(
          leaderX,
          horse.group.position.x
        );

        const gallop =
          elapsed * 13 +
          horse.phase;

        horse.body.position.y =
          1.85 +
          Math.sin(gallop * 2) *
            0.08;

        horse.head.rotation.z =
          -0.16 +
          Math.sin(gallop * 2) *
            0.05;

        horse.jockey.position.y =
          Math.sin(gallop * 2) *
          0.07;

        horse.jockey.rotation.z =
          Math.sin(gallop) *
          0.035;

        horse.legs.forEach(
          (leg, index) => {
            const opposite =
              index % 2 === 0
                ? 1
                : -1;

            leg.rotation.z =
              Math.sin(gallop) *
              0.65 *
              opposite;
          }
        );

        horse.group.position.z =
          horse.lane +
          Math.sin(
            elapsed * 0.35 +
              horse.phase
          ) *
            0.12;
      });

      const desiredCameraX =
        leaderX - 8;

      cameraX +=
        (desiredCameraX -
          cameraX) *
        0.025;

      camera.position.x = cameraX;
      camera.position.y =
        8.2 +
        Math.sin(elapsed * 0.7) *
          0.06;

      camera.position.z = 21;

      camera.lookAt(
        cameraX + 18,
        2.0,
        0
      );

      renderer.render(
        scene,
        camera
      );
    };

    animate();

    const handleResize = () => {
      if (!mount) {
        return;
      }

      camera.aspect =
        mount.clientWidth /
        mount.clientHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(
        mount.clientWidth,
        mount.clientHeight
      );
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      window.removeEventListener(
        "resize",
        handleResize
      );

      renderer.dispose();

      if (
        renderer.domElement.parentElement ===
        mount
      ) {
        mount.removeChild(
          renderer.domElement
        );
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#87ccef",
      }}
    >
      <div
        ref={mountRef}
        style={{
          position: "absolute",
          inset: 0,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 18,
          left: "50%",
          transform: "translateX(-50%)",
          color: "#ffffff",
          fontSize: "clamp(22px, 3vw, 42px)",
          fontWeight: 900,
          textShadow:
            "0 3px 10px rgba(0,0,0,0.8)",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        WEDDING DERBY 3D TEST
      </div>

      <div
        style={{
          position: "absolute",
          left: 20,
          bottom: 18,
          padding: "10px 18px",
          borderRadius: 12,
          background: "rgba(0,0,0,0.65)",
          color: "#ffffff",
          fontSize: 14,
          fontWeight: 700,
          pointerEvents: "none",
        }}
      >
        11 HORSES / CAMERA TEST
      </div>
    </div>
  );
}

export default Race3DPage;