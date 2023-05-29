import Head from 'next/head'
import styles from '../styles/Home.module.css'

import React from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from '../components/scene';
// import { FPS } from '../components/fps';

function Game() {
    return (
        <>
            <Head>
                <title>Fool's Crawl</title>
                <meta name="description" content="Donsol inspired game" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className={styles.container}>
                <Canvas>
                    {/* <FPS /> */}
                    <Scene />
                </Canvas>
            </div>
        </>
    );
}

export default Game;
