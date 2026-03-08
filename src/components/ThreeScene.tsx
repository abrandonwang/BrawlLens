"use client"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

export default function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      10,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    let mixer;
    camera.position.z = 13
    let bibi;

    const loader = new GLTFLoader()
    loader.load("/bibi_gamer_geo.glb", (gltf) => {
        bibi = gltf.scene;
        bibi.position.y = -1.20;
        bibi.rotation.y = Math.PI;
        scene.add(bibi)

        mixer = new THREE.AnimationMixer(bibi)
        mixer.clipAction(gltf.animations[3]).play()
        
        console.log(gltf.animations)
    })

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    mountRef.current?.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3)
    scene.add(ambientLight)

    const topLight = new THREE.DirectionalLight(0xffffff, 1);
    topLight.position.set(500, 500, 500);
    scene.add(topLight);

    const reRender3D = () => {
      requestAnimationFrame(reRender3D)
      renderer.render(scene, camera)
      if (mixer) mixer.update(0.02);
    }
    reRender3D()

    return () => {
      renderer.dispose()
      mountRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 top-[60px] pointer-events-none"
    />
  )
}
