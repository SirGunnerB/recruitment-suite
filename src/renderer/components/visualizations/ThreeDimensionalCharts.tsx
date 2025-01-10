import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { Box, useTheme } from '@mui/material';
import { gsap } from 'gsap';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry';

interface DataPoint {
  x: number;
  y: number;
  z: number;
  label: string;
  value: number;
  color?: string;
}

interface ThreeDChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  type: '3d-scatter' | '3d-bar' | '3d-surface' | '3d-network';
  animated?: boolean;
  interactive?: boolean;
  onDataPointClick?: (point: DataPoint) => void;
}

export const ThreeDChart: React.FC<ThreeDChartProps> = ({
  data,
  width = 800,
  height = 600,
  type,
  animated = true,
  interactive = true,
  onDataPointClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.palette.background.default);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Label renderer setup
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';

    // Add renderers to container
    containerRef.current.appendChild(renderer.domElement);
    containerRef.current.appendChild(labelRenderer.domElement);

    // Controls setup
    if (interactive) {
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
    }

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Add chart based on type
    let objects: THREE.Object3D[] = [];
    switch (type) {
      case '3d-scatter':
        objects = createScatterPlot(data, scene);
        break;
      case '3d-bar':
        objects = createBarChart(data, scene);
        break;
      case '3d-surface':
        objects = createSurfacePlot(data, scene);
        break;
      case '3d-network':
        objects = createNetworkGraph(data, scene);
        break;
    }

    // Animation setup
    if (animated) {
      animateObjects(objects);
    }

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
        containerRef.current.removeChild(labelRenderer.domElement);
      }
    };
  }, [data, width, height, type, animated, interactive, theme]);

  return <Box ref={containerRef} sx={{ width, height, position: 'relative' }} />;
};

// Helper functions for creating different chart types
const createScatterPlot = (data: DataPoint[], scene: THREE.Scene): THREE.Object3D[] => {
  const objects: THREE.Object3D[] = [];

  data.forEach(point => {
    const geometry = new THREE.SphereGeometry(0.1);
    const material = new THREE.MeshPhongMaterial({
      color: point.color || 0x0000ff,
    });
    const sphere = new THREE.Mesh(geometry, material);
    
    sphere.position.set(point.x, point.y, point.z);
    scene.add(sphere);
    objects.push(sphere);

    // Add label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.textContent = point.label;
    labelDiv.style.marginTop = '-1em';
    const label = new CSS2DObject(labelDiv);
    label.position.set(point.x, point.y + 0.2, point.z);
    sphere.add(label);
  });

  return objects;
};

const createBarChart = (data: DataPoint[], scene: THREE.Scene): THREE.Object3D[] => {
  const objects: THREE.Object3D[] = [];

  data.forEach(point => {
    const height = point.value;
    const geometry = new THREE.BoxGeometry(0.5, height, 0.5);
    const material = new THREE.MeshPhongMaterial({
      color: point.color || 0x00ff00,
    });
    const bar = new THREE.Mesh(geometry, material);
    
    bar.position.set(point.x, height / 2, point.z);
    scene.add(bar);
    objects.push(bar);

    // Add label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.textContent = `${point.label}: ${point.value}`;
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, height + 0.2, 0);
    bar.add(label);
  });

  return objects;
};

const createSurfacePlot = (data: DataPoint[], scene: THREE.Scene): THREE.Object3D[] => {
  const objects: THREE.Object3D[] = [];

  const createParametricSurface = (u: number, v: number, target: THREE.Vector3): void => {
    const x = 50 * Math.sin(u) * Math.cos(v);
    const y = 50 * Math.sin(u) * Math.sin(v);
    const z = 50 * Math.cos(u);
    target.set(x, y, z);
  };

  const geometry = new ParametricGeometry(
    createParametricSurface,
    25,
    25
  );

  const material = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    wireframe: true,
  });

  const surface = new THREE.Mesh(geometry, material);
  scene.add(surface);
  objects.push(surface);

  return objects;
};

const createNetworkGraph = (data: DataPoint[], scene: THREE.Scene): THREE.Object3D[] => {
  const objects: THREE.Object3D[] = [];

  // Create nodes
  data.forEach(point => {
    const geometry = new THREE.SphereGeometry(0.2);
    const material = new THREE.MeshPhongMaterial({
      color: point.color || 0xff0000,
    });
    const node = new THREE.Mesh(geometry, material);
    
    node.position.set(point.x, point.y, point.z);
    scene.add(node);
    objects.push(node);

    // Add label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.textContent = point.label;
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, 0.3, 0);
    node.add(label);
  });

  // Create edges
  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      const distance = calculateDistance(data[i], data[j]);
      if (distance < 2) { // Threshold for connecting nodes
        const geometry = new THREE.CylinderGeometry(0.02, 0.02, distance);
        const material = new THREE.MeshPhongMaterial({ color: 0x999999 });
        const edge = new THREE.Mesh(geometry, material);
        
        // Position and rotate edge to connect nodes
        const midpoint = {
          x: (data[i].x + data[j].x) / 2,
          y: (data[i].y + data[j].y) / 2,
          z: (data[i].z + data[j].z) / 2,
        };
        edge.position.set(midpoint.x, midpoint.y, midpoint.z);
        edge.lookAt(data[j].x, data[j].y, data[j].z);
        edge.rotateX(Math.PI / 2);
        
        scene.add(edge);
        objects.push(edge);
      }
    }
  }

  return objects;
};

// Helper functions for animations and calculations
const animateObjects = (objects: THREE.Object3D[]) => {
  objects.forEach(object => {
    // Initial scale
    object.scale.set(0.001, 0.001, 0.001);

    // Animate scale
    gsap.to(object.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1,
      ease: 'elastic.out(1, 0.5)',
    });

    // Animate position
    gsap.from(object.position, {
      y: object.position.y - 2,
      duration: 1,
      ease: 'power2.out',
    });
  });
};

const interpolateHeight = (x: number, z: number, data: DataPoint[]): number => {
  // Simple bilinear interpolation
  let sum = 0;
  let weightSum = 0;

  data.forEach(point => {
    const distance = Math.sqrt(
      Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2)
    );
    if (distance === 0) return point.y;

    const weight = 1 / Math.pow(distance, 2);
    sum += point.y * weight;
    weightSum += weight;
  });

  return sum / weightSum;
};

const calculateDistance = (point1: DataPoint, point2: DataPoint): number => {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) +
    Math.pow(point2.y - point1.y, 2) +
    Math.pow(point2.z - point1.z, 2)
  );
};
