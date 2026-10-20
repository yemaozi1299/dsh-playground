---
description: "Installable practice layer that adds the greet tool to a dsh profile; open it to learn how a workspace bundle, its patch document, and its model-facing contract fit together."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-hello-greet

## Summary

This experimental layer inserts one plugin that registers a `greet` tool. In a workspace checkout, `pnpm dsh plugin --profile <name> add ./packages/experimental/hello-greet` adds the layer, and every later launch of that profile exposes the tool to the model. Remove the layer with `pnpm dsh plugin --profile <name> remove @deepseek-ai/dsh-experimental-hello-greet`. The package is private and unpublished, and it exists as a worked example of the bundle path rather than as a product capability.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

### Install into a profile

Run both commands from the workspace root:

```text
pnpm dsh plugin --profile web add ./packages/experimental/hello-greet
pnpm dsh plugin --profile web remove @deepseek-ai/dsh-experimental-hello-greet
```

The add command records a `link:` dependency in the profile and appends the package name to `dsh.profile.bundles`. A package that declares `dsh.bundle.patch` contributes one layer; without that declaration the install succeeds as a plain dependency and the layer never appears. This package is private, so its npm name does not resolve from the registry; install it from a checkout.

### What you get

One global tool named `greet`. The model sends a required `name` and an optional `language`; the tool returns a greeting as one text block. The plugin registers the tool through `ctx.tools.register` and declares `inject: ['tools']`, so it stays pending until the tool registry is ready.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The [patch document](cordis.patch.yml) inserts one row whose `name` is this package. The entry point [src/index.ts](src/index.ts) exports `name`, `inject`, and `apply`; `apply` registers the tool with `defineTool`. The greeting text and the language list are constants in that file, so the layer accepts no configuration.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Adding a workspace package](../../../docs/cookbook/adding-a-package.md) — the file list and gates this package follows.
- [Package and profile installation](../../../docs/user/develop/basic/publish.md) — how a bundle layer reaches a profile.
- [Experimental group map](../README.md) — the other pre-stable packages and their status.

-----

<a id="model-experience"></a>
## Model Experience

### Greet tool

#### What the model sees

One tool named `greet` with the description "Greet someone by name.", a required string parameter `name`, and an optional `language` parameter whose enum is `zh` or `en`. Every successful call returns one text block containing the greeting, for example `你好，Ada！`.

#### Token effect

The complete tool schema is sent on every request that mounts this layer. A call adds the short greeting text as one tool result and no other context.

#### KV Cache effect

The tool schema occupies part of the reusable request prefix, so mounting, removing, or editing this layer changes that prefix and prevents reuse of a cache entry created before the change. Tool calls and results append after the prefix without changing it.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Private and unpublished** — the npm name does not resolve outside this checkout; install from `./packages/experimental/hello-greet`.
- **One fixed tool name** — a composition that already registers `greet` fails to load with `tool "greet" is already registered`.
- **No configuration** — the language list and greeting text are constants, so changing either means editing `src/index.ts`.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
