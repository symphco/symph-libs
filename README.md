# SymphCore

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ **This workspace has been generated by [Nx, Smart Monorepos · Fast CI.](https://nx.dev)** ✨

The goal of this project is to export the ML project's NestJS logger and re-use it as a package that can be implemented on other projects as a dependency.

## Set-up

```
# Node Version
v20.11.1

# Install the dependencies
npm install
```

## Building the Project

```
npx nx build <project> <...options>
```

## Installing the project locally using NPM Link

Run the build command, this will generate a `dist` folder with the production output of the project.

```
npx nx build logger
```

Navigate inside the `dist` output of the build project, in this case `logger`

```
cd dist/logger
```

Run `npm link` command

```
npm link

# This will let npm know to install the package from this directory when other projects use npm link to install it.
```

Next step is to navigate to the project where you want to install this package.

```
cd <another-project-name>
```

Then install the package using npm link

```
npm link @symphco/logger
```

If you don't know what package name you need to reference, look at the `package.json` name property of said project, that will be the name of the package.

In this example it's `symphco/logger`, you will see this value if you go into the `logger/package.json` file.

## Importing the package in another project after installing with NPM Link

After installing the project using NPM Link, you can import it like so

```
import { LoggerService } from '@symphco/logger'
```

If you don't know what package name you need to reference, look at the `package.json` name property of said project, that will be the name of the package.

In this example it's `symphco/logger`, you will see this value if you go into the `logger/package.json` file.
Once this is done, you can use it as a dependency on your project similar to NPM packages.

**NOTE: These steps are for testing it locally, the end product should be a npm package published in NPM**

## Integrate with editors

Enhance your Nx experience by installing [Nx Console](https://nx.dev/nx-console) for your favorite editor. Nx Console
provides an interactive UI to view your projects, run tasks, generate code, and more! Available for VSCode, IntelliJ and
comes with a LSP for Vim users.

## Nx plugins and code generators

Add Nx plugins to leverage their code generators and automated, inferred tasks.

```
# Add plugin
npx nx add @nx/react

# Use code generator
npx nx generate @nx/react:app demo

# Run development server
npx nx serve demo

# View project details
npx nx show project demo --web
```

Run `npx nx list` to get a list of available plugins and whether they have generators. Then run `npx nx list <plugin-name>` to see what generators are available.

Learn more about [code generators](https://nx.dev/features/generate-code) and [inferred tasks](https://nx.dev/concepts/inferred-tasks) in the docs.

## Running tasks

To execute tasks with Nx use the following syntax:

```
npx nx <target> <project> <...options>
```

You can also run multiple targets:

```
npx nx run-many -t <target1> <target2>
```

..or add `-p` to filter specific projects

```
npx nx run-many -t <target1> <target2> -p <proj1> <proj2>
```

Targets can be defined in the `package.json` or `projects.json`. Learn more [in the docs](https://nx.dev/features/run-tasks).

## Set up CI!

Nx comes with local caching already built-in (check your `nx.json`). On CI you might want to go a step further.

- [Set up remote caching](https://nx.dev/features/share-your-cache)
- [Set up task distribution across multiple machines](https://nx.dev/nx-cloud/features/distribute-task-execution)
- [Learn more how to setup CI](https://nx.dev/recipes/ci)

## Explore the project graph

Run `npx nx graph` to show the graph of the workspace.
It will show tasks that you can run with Nx.

- [Learn more about Exploring the Project Graph](https://nx.dev/core-features/explore-graph)

## Connect with us!

- [Join the community](https://nx.dev/community)
- [Subscribe to the Nx Youtube Channel](https://www.youtube.com/@nxdevtools)
- [Follow us on Twitter](https://twitter.com/nxdevtools)
