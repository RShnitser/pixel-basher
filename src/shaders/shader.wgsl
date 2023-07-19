struct Uniforms {
    color: vec4f,
    matrix: mat3x3f
}

struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f
}

@group(0) @binding(0) var<storage, read> uniforms : array<Uniforms>;

@vertex
fn vertex_main(
    @builtin(instance_index) Id: u32,
    @location(0) position: vec2f
) -> VertexOut {
    var output: VertexOut;

    let clipSpace = (uniforms[Id].matrix * vec3f(position, 1)).xy;

    output.position = vec4f(clipSpace, 0.0, 1.0);
    output.color = uniforms[Id].color;
    return output;
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f {
    return fragData.color;
}
