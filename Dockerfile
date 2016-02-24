FROM node:5.7.0-slim

# Add this toolchain
ENV SRCLIBPATH /srclib
ADD . /srclib/srclib-typescript/
WORKDIR /srclib/srclib-typescript
RUN npm install
RUN npm install tsc -g
RUN tsc -p .
