import {series, watch, dest} from 'gulp'
import ts from 'gulp-typescript'
import del from 'del'
import {spawn} from 'child_process'

const tsProject = ts.createProject("tsconfig.json", {declaration: true})

function tsBuild() {
  return tsProject
    .src()
    .pipe(tsProject())
    .pipe(dest("dist"))
}

async function run() {
  spawn('node', ['dist/index.js'], {stdio: 'inherit'})
}

async function tsRun() {
  spawn('ts-node', ['src/index.ts'], {stdio: 'inherit'})
}

function watchRun() {
  watch('src/*.ts', tsRun)
}

export const build = tsBuild

export function clean() {
  return del('dist')
}

export const start = series(clean, build, run)

export const dev = series(tsRun, watchRun)

