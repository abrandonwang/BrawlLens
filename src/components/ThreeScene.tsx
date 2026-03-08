"use client"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

export default function ThreeScene({ attack }: { attack: number }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const animationsRef = useRef<THREE.AnimationClip[]>([])

  useEffect(() => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      10,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 13

    const loader = new GLTFLoader()
    loader.load("/bibi_gamer_geo.glb", (gltf) => {
        const bibi = gltf.scene;
        bibi.position.y = -0.8;
        bibi.scale.set(0.5, 0.5, 0.5)
        bibi.rotation.y = Math.PI;
        scene.add(bibi)

        animationsRef.current = gltf.animations
        mixerRef.current = new THREE.AnimationMixer(bibi)
        mixerRef.current.clipAction(gltf.animations[3]).play()

        console.log(gltf.animations)
    })

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    const mount = mountRef.current
    mount?.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3)
    scene.add(ambientLight)

    const topLight = new THREE.DirectionalLight(0xffffff, 1);
    topLight.position.set(500, 500, 500);
    scene.add(topLight);

    let animFrameId: number
    const reRender3D = () => {
      animFrameId = requestAnimationFrame(reRender3D)
      renderer.render(scene, camera)
      if (mixerRef.current) mixerRef.current.update(0.02);
    }
    reRender3D()

    return () => {
      cancelAnimationFrame(animFrameId)
      renderer.dispose()
      mount?.removeChild(renderer.domElement)
    }
  }, [])

  useEffect(() => {
    const mixer = mixerRef.current
    if (!mixer || animationsRef.current.length === 0 || attack === 0) return

    const attackClip = animationsRef.current[0]
    const idleClip = animationsRef.current[3]

    mixer.stopAllAction()
    const action = mixer.clipAction(attackClip)
    action.setLoop(THREE.LoopOnce, 1)
    action.clampWhenFinished = true
    action.play()

    const onFinished = () => {
      mixer.stopAllAction()
      mixer.clipAction(idleClip).play()
    }
    mixer.addEventListener("finished", onFinished)
    return () => mixer.removeEventListener("finished", onFinished)
  }, [attack])

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 top-[60px] pointer-events-none"
    />
  )
}
