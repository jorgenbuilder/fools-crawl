import Head from "next/head";
import styles from "../styles/Home.module.css";

import React from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "../components/scene";
import DialogueUI from "../components/dialogue";
// import { FPS } from '../components/fps';

function Game() {
  return (
    <>
      <Head>
        <title>Fools Crawl</title>
        <meta name="description" content="Donsol inspired game" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#000000" />
      </Head>
      <div className={styles.container}>
        <Canvas>
          {/* <FPS /> */}
          <Scene />
        </Canvas>
        <DialogueUI />
      </div>
    </>
  );
}

export default Game;
