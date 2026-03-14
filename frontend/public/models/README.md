# 3D Models Directory

Place `.glb` or `.gltf` files here to load them in the 3D Resort Explorer.

## How to use

1. Export your 3D model from Blender / SketchUp / any 3D tool as `.glb` (recommended) or `.gltf`
2. Drop the file into this `public/models/` folder
3. It will be available at the URL `/models/your-model.glb`

## In the code

The `ResortViewer` component includes a `<GLBModel>` helper. Use it inside the scene:

```tsx
<GLBModel url="/models/resort-building.glb" position={[0, 0, 0]} scale={1} />
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `url` | `string` | required | Path to the `.glb`/`.gltf` file |
| `position` | `[x, y, z]` | `[0, 0, 0]` | World position |
| `scale` | `number` | `1` | Uniform scale factor |
| `rotation` | `[x, y, z]` | `[0, 0, 0]` | Euler rotation in radians |

## Recommended sources for free 3D models

- [Sketchfab](https://sketchfab.com) (filter by "Downloadable" + "glTF")
- [Poly Haven](https://polyhaven.com/models)
- [Kenney Assets](https://kenney.nl/assets)
- [TurboSquid](https://turbosquid.com) (filter by "Free" + "glTF/GLB")
