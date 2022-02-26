# ehrlich-24hcodechallenge

## Getting a local copy

```
git clone https://github.com/iammattsantos/erhlich-24hcodechallenge.git [yourdirectory]
```

Make sure to install `node_modules` after cloning

```
cd [yourdirectory]/erhlich-24hcodechallenge
npm install
```

## Run the application

```
npm start
```

You can also run `node .` to skip the build step.

Open http://127.0.0.1:3000 in your browser.

## Rebuild the project

To incrementally build the project:

```sh
npm run build
```

To force a full build by cleaning up cached artifacts:

```sh
npm run rebuild
```

## Fix code style and formatting issues

```sh
npm run lint
```

To automatically fix such issues:

```sh
npm run lint:fix
```
