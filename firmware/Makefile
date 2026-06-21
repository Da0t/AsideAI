# The Narrator — firmware build (QNX SDP 8.0, Raspberry Pi 4 / aarch64le).
#
# This is a STUB. Configure the QNX SDP toolchain before building.
#
# FASTEST PATH: don't start from here — fork qnx/projects/ai-camera-app and adapt
# its build. It already links QSF camera capture + TensorFlow Lite on QNX, which
# is the hard part. Then add this project's net_client + event model.
#
# Toolchain setup (host):
#   source <QNX_SDP_8.0>/qnxsdp-env.sh        # puts qcc/q++ on PATH
#
# Sketch (fill in real include/lib paths from the QNX SDP + your TFLite build):
#   CXX      = q++ -Vgcc_ntoaarch64le
#   CXXFLAGS = -std=c++17 -Iinclude $(QSF_INCLUDES) $(TFLITE_INCLUDES)
#   LDFLAGS  = $(QSF_LIBS) $(TFLITE_LIBS)      # e.g. -lcamapi ... -ltensorflowlite
#   SRCS     = $(wildcard src/*.cpp)
#
# Then a normal compile/link rule producing ./the-narrator-firmware.

.PHONY: all
all:
	@echo "TODO: configure the QNX SDP 8.0 toolchain (qcc/q++) — see README.md"
	@echo "Fork qnx/projects/ai-camera-app for the QSF + TFLite build, then add src/net_client.cpp."
	@false
