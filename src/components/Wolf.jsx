import React, { useEffect, useRef, useMemo } from 'react'
import * as THREE from "three"
import { useThree } from '@react-three/fiber'
import { useGLTF, useTexture, useAnimations } from '@react-three/drei'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(useGSAP)
gsap.registerPlugin(ScrollTrigger)

const Wolf = () => {
  const model = useGLTF("/models/dog.drc.glb")
  const { camera, gl } = useThree()

  useEffect(() => {
    camera.position.z = 0.5
    gl.toneMapping = THREE.ReinhardToneMapping
    gl.outputColorSpace = THREE.SRGBColorSpace
  }, [camera, gl])

  const { actions } = useAnimations(model.animations, model.scene)

  useEffect(() => {
    if (actions["Take 001"]) {
      actions["Take 001"].play()
    }
  }, [actions])

  const [normalMap, branchMap, branchNormalMap] = useTexture([
    "/dog_normals.jpg",
    "/branches_diffuse.jpg",
    "/branches_normals.jpg"
  ]).map((texture) => {
    texture.flipY = false
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  })

  const matcaps = useTexture([
    "/matcap/mat-1.png",
    "/matcap/mat-2.png",
    "/matcap/mat-3.png",
    "/matcap/mat-4.png",
    "/matcap/mat-5.png",
    "/matcap/mat-6.png",
    "/matcap/mat-7.png",
    "/matcap/mat-8.png",
    "/matcap/mat-9.png",
    "/matcap/mat-10.png",
    "/matcap/mat-11.png",
    "/matcap/mat-12.png",
    "/matcap/mat-13.png",
    "/matcap/mat-14.png",
    "/matcap/mat-15.png",
    "/matcap/mat-16.png",
    "/matcap/mat-17.png",
    "/matcap/mat-18.png",
    "/matcap/mat-19.png",
    "/matcap/mat-20.png",
  ]).map((texture) => {
    texture.flipY = false
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  })

  const [
    mat1, mat2, mat3, mat4, mat5, mat6, mat7, mat8, mat9, mat10,
    mat11, mat12, mat13, mat14, mat15, mat16, mat17, mat18, mat19, mat20
  ] = matcaps

  const material = useRef({
    uMatcap1: { value: mat19 },
    uMatcap2: { value: mat2 },
    uProgress: { value: 1.1 }
  })

  const { dogMaterial, branchMaterial } = useMemo(() => {
    const dogMat = new THREE.MeshMatcapMaterial({
      normalMap: normalMap,
      matcap: mat2
    })

    const branchMat = new THREE.MeshMatcapMaterial({
      normalMap: branchNormalMap,
      matcap: mat2
    })

    function onBeforeCompile(shader) {
      shader.uniforms.uMatcapTexture1 = material.current.uMatcap1
      shader.uniforms.uMatcapTexture2 = material.current.uMatcap2
      shader.uniforms.uProgress = material.current.uProgress

      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        `
    uniform sampler2D uMatcapTexture1;
    uniform sampler2D uMatcapTexture2;
    uniform float uProgress;

    void main() {
    `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        "vec4 matcapColor = texture2D( matcap, uv );",
        `
      vec4 matcapColor1 = texture2D( uMatcapTexture1, uv );
      vec4 matcapColor2 = texture2D( uMatcapTexture2, uv );
      float transitionFactor  = 0.2;
      
      float progress = smoothstep(uProgress - transitionFactor,uProgress, (vViewPosition.x+vViewPosition.y)*0.5 + 0.5);

      vec4 matcapColor = mix(matcapColor2, matcapColor1, progress );
    `
      )
    }

    dogMat.onBeforeCompile = onBeforeCompile
    branchMat.onBeforeCompile = onBeforeCompile

    return { dogMaterial: dogMat, branchMaterial: branchMat }
  }, [normalMap, branchNormalMap, mat2])

  useMemo(() => {
    model.scene.traverse((child) => {
      if (child.name.includes("DOG")) {
        child.material = dogMaterial
      } else {
        child.material = branchMaterial
      }
    })
  }, [model.scene, dogMaterial, branchMaterial])

  const wolfModel = useRef(model)

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-1",
        endTrigger: "#section-5",
        start: "top top",
        end: "bottom bottom",
        scrub: true
      }
    })

    tl.to(wolfModel.current.scene.position, {
      z: "-=0.7",
      y: "+=0.1"
    })
      .to(wolfModel.current.scene.rotation, {
        x: `+=${Math.PI / 15}`
      })
      .to(wolfModel.current.scene.rotation, {
        y: `-=${Math.PI}`
      }, "third")
      .to(wolfModel.current.scene.position, {
        x: "-=0.4",
        z: "+=0.5",
      }, "third")
  }, [])

  useEffect(() => {
    const items = [
      { selector: `.title[img-title="tommorrowland"]`, mat: mat19 },
      { selector: `.title[img-title="navy-pier"]`, mat: mat8 },
      { selector: `.title[img-title="msi-chicago"]`, mat: mat9 },
      { selector: `.title[img-title="phone"]`, mat: mat12 },
      { selector: `.title[img-title="kikk"]`, mat: mat10 },
      { selector: `.title[img-title="kennedy"]`, mat: mat8 },
      { selector: `.title[img-title="opera"]`, mat: mat13 },
    ]

    const cleanupFns = []

    items.forEach(({ selector, mat }) => {
      const elem = document.querySelector(selector)
      if (elem) {
        const handler = () => {
          material.current.uMatcap1.value = mat
          gsap.to(material.current.uProgress, {
            value: 0.0,
            onComplete: () => {
              material.current.uMatcap2.value = material.current.uMatcap1.value
              material.current.uProgress.value = 1.1
            }
          })
        }
        elem.addEventListener("mouseenter", handler)
        cleanupFns.push(() => elem.removeEventListener("mouseenter", handler))
      }
    })

    const titlesElem = document.querySelector(`.titles`)
    if (titlesElem) {
      const mouseLeaveHandler = () => {
        material.current.uMatcap1.value = mat2
        gsap.to(material.current.uProgress, {
          value: 0.0,
          onComplete: () => {
            material.current.uMatcap2.value = material.current.uMatcap1.value
            material.current.uProgress.value = 1.1
          }
        })
      }
      titlesElem.addEventListener("mouseleave", mouseLeaveHandler)
      cleanupFns.push(() => titlesElem.removeEventListener("mouseleave", mouseLeaveHandler))
    }

    return () => {
      cleanupFns.forEach(fn => fn())
    }
  }, [mat2, mat8, mat9, mat10, mat12, mat13, mat19])

  return (
    <>
      <primitive object={model.scene} position={[0.18, -0.6, 0]} rotation={[0, Math.PI / 7, 0]} />
      <directionalLight position={[0, 5, 5]} color={0xFFFFFF} intensity={10} />
    </>
  )
}

export default Wolf