package {
	import flash.events.Event;
	import flash.media.Sound;
	import flash.media.SoundChannel;
	import flash.media.SoundTransform;
	import flash.net.URLRequest;

	public class Map extends Api {

		public var fondAudio;
		public var player;
		public var url = 'test.mp3';

		public function Map() {
			super();
			mapWidth = 950;
			mapHeight = 425;
			horizonHeight = 425;
			lightEffect = false;
			fogEffect = false;
			skyLayer = false;
			rainEffect = false;
		}

		override public function onInitMap(): * {
			camera.physic.addCloudTileColor(16776960);
			camera.physic.addCloudTileColor(16711680);
			camera.physic.addWaterTileColor(255);
			
			token = 'issou';

			super.onInitMap();

			if (url.length > 0) {
				initAudio();
			}
		}

		private function initAudio() {
			fondAudio = new Sound();
			fondAudio.load(new URLRequest(url));
			playSound();
		}

		private function playSound() {
			player = fondAudio.play();
			player.soundTransform = new SoundTransform(this.camera.quality.ambiantVolume * 0.4);
			player.addEventListener(Event.SOUND_COMPLETE, this.onComplete);
		}

		private function onComplete(param1: Event): void {
			SoundChannel(param1.target).removeEventListener(param1.type, onComplete);
			playSound();
		}

		override public function onEnvironmentEvent(param1: Object): * {
			if (param1.newColor == 0xff0000) {
				param1.walker.paused = true;
				camera.userDie("est cuit à point :D", 8);
			}
			if (param1.newColor == 65280 && param1.certified) {
				param1.walker.grimpe = true;
			}
			if (param1.newColor == 61440 && param1.certified) {
				param1.walker.grimpe = false;
			}
			if (param1.lastColor == 65280 && param1.certified) {
				param1.walker.grimpe = false;
			}
			if (param1.newColor == 255) {
				param1.walker.underWater = true;
				if (param1.certified) {
					camera.waterFx(param1.walker.position.x, 370, {
						"speed": param1.walker.speed
					});
				}
			}
			if (param1.lastColor == 255) {
				param1.walker.underWater = false;
				if (param1.certified) {
					camera.waterFx(param1.walker.position.x, 370, {
						"speed": param1.walker.speed
					});
				}
			}

			if (param1.eventType < 40 && param1.certified) {
				if (param1.newColor == 0x00eeee && param1.eventType != 21) {
					param1.walker.interactiv = 1005;
				} else {
					param1.walker.interactiv = 0;
				}
			}
		}


		override public function onInteractivEvent(param1: Object): * {
			if (param1.walker.interactiv == 1005 && param1.walker.clientControled && param1.walker.walking == 0) {
				param1.walker.interactiv = 0;
				camera.movePersoToMap(1001, {
					"POSITION": {
						"x": 885,
						"y": 394
					}
				});
			}
		}

		override public function dispose(): * {
			super.dispose();
			if (player) {
				player.stop();
			}
		}

		override public function onStartMap(): * {
			camera.addPreloadList(443);
			camera.addPreloadList(444);
			camera.addPreloadList(445);
			camera.addPreloadList(446);
			super.onStartMap();
		}

		override public function onOverLimitEvent(param1: Object): * {
			var _loc2_: Boolean = false;
			if (camera) {
				if (camera.haveBlablaland()) {
					_loc2_ = true;
				}
			}
			if (!param1.walker.clientControled) {
				_loc2_ = false;
			}
			if (_loc2_) {
				if (param1.walker.position.x >= mapWidth) {
					param1.walker.position.x = 0;
					camera.movePersoToMap(444);
				} else if (param1.walker.position.x < 0) {
					param1.walker.position.x = mapWidth - 1;
					camera.movePersoToMap(443);
				} else if (param1.walker.position.y < 0) {
					param1.walker.position.y = mapHeight - 1;
					camera.movePersoToMap(445);
				} else if (param1.walker.position.y >= mapHeight) {
					param1.walker.position.y = 0;
					camera.movePersoToMap(446);
				}
			}
		}
	}
}