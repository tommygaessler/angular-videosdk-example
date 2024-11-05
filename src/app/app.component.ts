import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import ZoomVideo from '@zoom/videosdk'



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class AppComponent {
  
  client = ZoomVideo.createClient()
  stream: any
  authEndpoint = 'https://or116ttpz8.execute-api.us-west-1.amazonaws.com/default/videosdk'

  constructor(public httpClient: HttpClient) {

  }

  getVideoSDKJWT() {
    this.httpClient.post(this.authEndpoint, JSON.stringify({
	    sessionName:  'test123',
      role: 0,
    })).subscribe((data: any) => {
      if(data.signature) {
        console.log(data.signature)
        this.joinSession(data.signature)
      } else {
        console.log(data)
      }
    })
  }

  joinSession(signature: any) {
    this.client.init('en-US', 'Global', { patchJsMedia: true, enforceMultipleVideos: true }).then(() => {
      this.client.join('test123', signature, 'Tommy', '123').then(() => {
        this.stream = this.client.getMediaStream()

        // check if existing users who joined before me and render their video if its on
        this.client.getAllUser().forEach((user) => {
          console.log(user)
          if(user.bVideoOn) {
            this.stream.attachVideo(user.userId, 3).then((userVideo: any) => {
              document.querySelector('video-player-container')?.appendChild(userVideo);
            })
          } else {
            // add blank user
          }
        })

        // event listener for when a user starts/stops their video
        this.client.on('user-updated', (user) => {
          console.log(user)
          if(user[0].userId !== this.client.getCurrentUserInfo().userId) {

            if(user[0].hasOwnProperty('bVideoOn') && user[0].bVideoOn === true) {
              this.stream.attachVideo(user[0].userId, 3).then((userVideo: any) => {
                document.querySelector('video-player-container')?.appendChild(userVideo)
              })
            } else if(user[0].hasOwnProperty('bVideoOn') && user[0].bVideoOn === false) {
              this.stream.detachVideo(user[0].userId)
            }

          }
        })

      }).catch((error) => {
        console.log(error)
      })
    })
  }

  // start video 
  startVideo() {
    this.stream.startVideo().then(() => {
      this.stream.attachVideo(this.client.getCurrentUserInfo().userId, 3).then((userVideo: any) => {
        document.querySelector('video-player-container')?.appendChild(userVideo)
      })
    })
  }

  // stop video 
  stopVideo() {
    this.stream.stopVideo().then(() => {
      this.stream.detachVideo(this.client.getCurrentUserInfo().userId)
    })
  }
}
