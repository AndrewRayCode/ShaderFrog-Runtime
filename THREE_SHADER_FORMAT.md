# Problem

THREE.js does not have a defined shader format for sharing raw GLSL shader code. [ShaderFrog](http://shaderfrog.com) requires a format to make shaders portable to the end user. This document suggests such a format.

This proposed format has some main pragmatic goals:
 - Provide a way to identify a shader when used in the end user's application;
 - Document the uniforms and their types used in the shader. This prevents the end user needing to duplicate uniform types in their implementation of the shader. For example, a user having to type `material.uniforms.color = { type: 'c' }` is redundant, since [ShaderFrog](http://shaderfrog.com) already knows that the `color` uniform is a [`THREE.Color`](http://threejs.org/docs/#Reference/Math/Color).

# Proposed Format
