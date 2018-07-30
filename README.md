[![Build Status](https://travis-ci.org/TeamVelocity/teamvelocity.github.io.svg?branch=master)](https://travis-ci.org/TeamVelocity/teamvelocity.github.io)
[![Coverage Status](https://coveralls.io/repos/github/TeamVelocity/teamvelocity.github.io/badge.svg?branch=master)](https://coveralls.io/github/TeamVelocity/teamvelocity.github.io?branch=master)

# teamvelocity.github.io
Source code for the Wheel of Jeopardy Game developed by Team Velocity.

## Developer Tools

### documentation.js
Documentation is used to generate the API docs.
        
        npm install -g documentation

## Build Documentation

First verify there are no errors using lint, then generate the docs

        documentation lint scripts/*
        documentation build scripts/* -f html -o docs
