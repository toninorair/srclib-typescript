FROM node:5.7.0-slim

# Add this toolchain
RUN apt-get install -qq make
ENV SRCLIBPATH /srclib
ADD . /srclib/srclib-typescript/
RUN cd /srclib/srclib-typescript && make
