# Sandboxed environment for building and running the Hylomorphic Claro
# program with Bazel. Mirrors the toolchain used by claro-lang's own
# devcontainer (Debian + Bazelisk + native build deps for the JVM-based
# Claro compiler). Bazel fetches its own hermetic JDK 11 per .bazelrc, so
# no system JDK is installed here.
FROM debian:bullseye-slim

# Native build dependencies required by claro-lang's own build (jcup, zip
# packaging, etc.), plus curl/git for fetching Bazel and its dependencies.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends \
       curl ca-certificates git pkg-config zip g++ zlib1g-dev unzip python3 \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Bazelisk reads .bazelversion and transparently downloads the exact Bazel
# release the project pins (6.4.0), matching what a local `bazel` invocation
# would use.
ARG BAZELISK_VERSION=v1.19.0
RUN curl -fSsL -o /usr/local/bin/bazel \
       "https://github.com/bazelbuild/bazelisk/releases/download/${BAZELISK_VERSION}/bazelisk-linux-amd64" \
    && chmod 0755 /usr/local/bin/bazel

ENV HOME=/root
WORKDIR /workspace

COPY .bazelrc .bazelversion MODULE.bazel ./
COPY example/ ./example/

# Bazel's own sandboxed action execution (mount/user namespaces) commonly
# fails when nested inside an unprivileged Docker container. Fall back to
# unsandboxed local execution so the build works out of the box here; this
# only affects hermeticity of the build step, not correctness of the program.
RUN echo "build --spawn_strategy=standalone" >> .bazelrc

# Build now so the image bakes in the compiled binary and downloaded
# dependencies (claro-lang archive + Maven artifacts) — `bazel run` at
# container start then just launches the already-built binary.
RUN bazel build //example:Hylomorphic_bin

# Hylomorphic is an interactive TUI: run the container with `-it` so stdin
# is attached, e.g.:
#   docker run -it --rm hylomorphic
CMD ["bazel", "run", "//example:Hylomorphic_bin"]
