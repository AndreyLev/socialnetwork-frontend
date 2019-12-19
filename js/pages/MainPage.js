// TODO: remove code duplication
export default class MainPage {

    firstElementId = 0;
    lastElementId = 0;
    newPostsQuantity = 0;

  constructor(context) {
    this._context = context;
    this._rootEl = context.rootEl();
  }

  init() {
      this._rootEl.innerHTML = `
      <div class="container">
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
          <a class="navbar-brand" href="#">Социальная сеть</a>
          <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbar-supported-content">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbar-supported-content">
            <ul class="navbar-nav mr-auto">
              <li class="nav-item active">
                <a class="nav-link" data-id="menu-main" href="/">Новостная лента</a>
              </li>
            </ul>
            <form data-id="search-form" class="form-inline my-2 my-lg-0">
              <input class="form-control mr-sm-2" type="search" placeholder="Искать...">
              <button class="btn btn-outline-success my-2 my-sm-0" type="submit">Поиск</button>
            </form>
          </div>
        </nav>
        <div class="row">
            <div class="col">
              <div class="card">
                <div class="card-body">
                  <form data-id="post-edit-form">
                    <input type="hidden" data-id="id-input" value="0">
                    <div class="form-group">
                      <label for="content-input">Текст</label>
                      <input type="text" data-id="content-input" class="form-control" id="content-input">
                    </div>
                    <div class="form-group">
                      <div class="custom-file">
                        <input type="hidden" data-id="media-name-input">
                        <input type="file" data-id="media-input" class="custom-file-input" id="media-input">
                        <label class="custom-file-label" for="media-input">Выбрать файл</label>
                      </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Сделать пост</button>
                  </form>
                </div>
              </div>
            </div>
        </div>
        <div class="container" data-id="new-posts">
        </div>
        </div>
        <div class="container" data-id="posts-container">
        </div>
         </div>
        <div class="container" data-id="next-posts-button">
        </div>
    
      </div>
      <!-- TODO: https://getbootstrap.com/docs/4.4/components/modal/ -->
      <div class="modal fade" data-id="error-modal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="exampleModalLabel">Error!</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div data-id="error-message" class="modal-body">
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

      this._rootEl.querySelector('[data-id=menu-main]').addEventListener('click', evt => {
          evt.preventDefault();
      });


      this._errorModal = $('[data-id=error-modal]'); // jquery
      this._errorMessageEl = this._rootEl.querySelector('[data-id=error-message]');

      this._newPostsEl = this._rootEl.querySelector('[data-id=new-posts]');
      this._postsContainerEl = this._rootEl.querySelector('[data-id=posts-container]');
      this._nextPostsButton = this._rootEl.querySelector('[data-id=next-posts-button]');
      this._postCreateFormEl = this._rootEl.querySelector('[data-id=post-edit-form]');
      this._idInputEl = this._postCreateFormEl.querySelector('[data-id=id-input]');
      this._contentInputEl = this._postCreateFormEl.querySelector('[data-id=content-input]');
      this._mediaNameInputEl = this._postCreateFormEl.querySelector('[data-id=media-name-input]');
      this._mediaInputEl = this._postCreateFormEl.querySelector('[data-id=media-input]');

      this._mediaInputEl.addEventListener('change', evt => {
          // evt.currentTarget -> тот, чей обработчик события сейчас выполняется
          // File -> Blob
          const [file] = Array.from(evt.currentTarget.files);
          // FormData -> сам выставит нужные заголовки и закодирует тело запроса
          const formData = new FormData();
          formData.append('file', file);
          this._context.post('/files/multipart', formData, {},
              text => {
                  const data = JSON.parse(text);
                  this._mediaNameInputEl.value = data.name;
              },
              error => {
                  this.showError(error);
              });
      });
      this._postCreateFormEl.addEventListener('submit', evt => {
          evt.preventDefault();
          //alert('HA! YOU CLICK ON THE BUTTON');
          const data = {
              id: Number(this._idInputEl.value),
              content: this._contentInputEl.value,
              media: this._mediaNameInputEl.value || null
          };
          this._context.post('/posts', JSON.stringify(data), {'Content-Type': 'application/json'},
              text => {
                  this._idInputEl.value = 0;
                  this._contentInputEl.value = '';
                  this._mediaNameInputEl.value = '';
                  this._mediaInputEl.value = '';
                  this.loadLastFivePosts();
              },
              error => {
                  this.showError(error);
              });
          this._newPostsEl.innerHTML = '';
          this.loadLastFivePosts();
      });

      this.loadLastFivePosts();
      //this.drawNewPostQuantityButton();
     // this.drawNewPostQuantityButton();
         this.pollNewPosts();
  }


  drawNewPostsButton() {

      const newPostsButtonEl = document.createElement('div');
      newPostsButtonEl.className = 'col-13';
      newPostsButtonEl.innerHTML = `
        <button type="button" data-action="new-posts" class="btn btn-primary btn-lg btn-block" data-dismiss="modal">Показать новые посты ${this.newPostsQuantity}</button>     
      `;

      newPostsButtonEl.querySelector('[data-action=new-posts]').addEventListener('click', evt => {
          this._newPostsEl.innerHTML = '';
          this._context.post(`/posts/${this.firstElementId}/${this.lastElementId}/drawnposts`, null, {},
              text => {
              const drawnPosts = JSON.parse(text);
                  this._context.post(`/posts/${this.firstElementId}/newposts`, null, {},
                      text => {
                          const newPosts = JSON.parse(text);
                          const postsToShow = newPosts.concat(drawnPosts);
                          this.newPostsQuantity = 0;
                          this.rebuildList(postsToShow);
                      }, error => {
                          this.showError(error)
                      });
              }, error => {
                  this.showError(error);
              });

      });

      this._newPostsEl.appendChild(newPostsButtonEl);
  }

  drawNextPostsButton(posts) {
      this._nextPostsButton.innerHTML = '';
      const nextPostsButtonEl = document.createElement('div');
      nextPostsButtonEl.className = 'col-13';
      nextPostsButtonEl.innerHTML = ` 
      <button type="button" data-action="next-posts" class="btn btn-primary btn-lg btn-block" data-dismiss="modal">Показать ещё</button>
      `;

      nextPostsButtonEl.querySelector('[data-action=next-posts]').addEventListener('click', evt => {
          this._context.post(`/posts/${this.lastElementId}/impression`, null, {},
              text => {
                const nextPosts = JSON.parse(text);
                const postsToShow = posts.concat(nextPosts);
                this._nextPostsButton.innerHTML='';
                this.rebuildList(postsToShow);
              }, error => {
                  this.showError(error);
              });
      });

      this._nextPostsButton.appendChild(nextPostsButtonEl);
  }

  getNewPostsQuantity() {
    this._context.get(`/posts/${this.firstElementId}/newPosts`, {},
        text => {
            const posts = JSON.parse(text);
            //alert(posts);
            this.newPostsQuantity = posts;
            //alert(this.newPostsQuantity);
        },
        error => {
            this.showError(error);
        });
  }

  drawNewPostQuantityButton() {
      this._newPostsEl.innerHTML = '';
      const newPostsButtonEl = document.createElement('div');
      newPostsButtonEl.className = 'col-13';
      newPostsButtonEl.innerHTML = `
        <button type="button" data-action="new-posts" class="btn btn-primary btn-lg btn-block" data-dismiss="modal">Show new posts ${this.newPostsQuantity}</button>
      `;

      newPostsButtonEl.querySelector('[data-action=new-posts]').addEventListener('click', evt => {

      });

      this._newPostsEl.appendChild(newPostsButtonEl);
  }

  loadLastFivePosts() {
    this._context.get('/posts/lastFivePosts', {},
        text => {
          const posts = JSON.parse(text);
          this.rebuildList(posts);
        },
        error => {
          this.showError(error);
        });
  }



  loadAll() {
    this._context.get('/posts', {},
      text => {
        const posts = JSON.parse(text);
        this.rebuildList(posts);
      },
      error => {
        this.showError(error);
      });
  }

  rebuildList(posts) {

      this.firstElementId = posts[0].id;
      this.lastElementId = posts[posts.length - 1].id;


      this._postsContainerEl.innerHTML = '';
      // alert('DRAWING POSTS');
      for (const post of posts) {
          const postEl = document.createElement('div');
          postEl.className = 'col-13';

          let postMedia = '';
          if (post.media !== null) {
              if (post.media.endsWith('.png') || post.media.endsWith('.jpg')) {
                  postMedia += `
            <img src="${this._context.mediaUrl()}/${post.media}" class="card-img-top" alt="...">
          `;
              } else if (post.media.endsWith('.mp4') || post.media.endsWith('.webm')) {
                  postMedia = `
            <div class="card-img-topcard-img-top embed-responsive embed-responsive-16by9 mb-2">
              <video src="${this._context.mediaUrl()}/${post.media}" class="embed-responsive-item" controls>
            </div>
          `;
              } else if (post.media.endsWith('.mp3')) {
                  postMedia = `
            <div class = "card-img-topcard-img-top embed-responsive embed-responsive-16by9 mb-2">
              <audio src = "${this._context.mediaUrl()}/${post.media}" class = "embed-responsive-item" controls>
            </div>
          `;
              }
          }

          postEl.innerHTML = `
        <div class="card mt-2">
          <div class="card-body">
            <p class="card-text">Пост написал : ${post.authorName}</p>
            <hr class="style-1">
            <p class="card-text">${post.content}</p>
            <div class="col-6">${postMedia}</div>
            <hr class="style-1">
            <p class="card-text">Рейтинг поста: ${post.likes}</p>
          </div>
          <div class="card-footer">
            <div class="row">
              <div class="col">
                <a href="#" data-action="like" class="btn btn-sm btn-primary">Like</a>
                <a href="#" data-action="dislike" class="btn btn-sm btn-danger">Dislike</a>
              </div>
              <div class="col text-right">
                <a href="#" data-action="edit" class="btn btn-sm btn-primary">Edit</a>
                <a href="#" data-action="remove" class="btn btn-sm btn-danger">Remove</a>
              </div>
            </div>
          </div>
        </div>
      `;
          postEl.querySelector('[data-action=like]').addEventListener('click', evt => {
              evt.preventDefault();
              this._context.post(`/posts/${post.id}/likes`, null, {},
                  () => {
                      this.loadLastFivePosts();
                  }, error => {
                      this.showError(error);
                  });
          });
          postEl.querySelector('[data-action=dislike]').addEventListener('click', evt => {
              evt.preventDefault();
              this._context.delete(`/posts/${post.id}/likes`, {},
                  () => {
                      this.loadLastFivePosts();
                  }, error => {
                      this.showError(error);
                  });
          });
          postEl.querySelector('[data-action=edit]').addEventListener('click', evt => {
              evt.preventDefault();
              this._idInputEl.value = post.id;
              this._contentInputEl.value = post.content;
              this._mediaNameInputEl.value = post.media;
              this._mediaInputEl.value = '';
          });
          postEl.querySelector('[data-action=remove]').addEventListener('click', evt => {
              evt.preventDefault();
              this._context.delete(`/posts/${post.id}`, {},
                  () => {
                      this.loadLastFivePosts();
                  }, error => {
                      this.showError(error);
                  });
          });

          this._postsContainerEl.appendChild(postEl);
      }
      this.drawNextPostsButton(posts);
  }




  writeMessageAboutNewPosts(posts) {
    this._timeout = setTimeout(() => {
      //alert(posts.length);

    }, 5000)
  }

    pollNewPosts() {
      this._timeout = setTimeout(() => {
          this.getNewPostsQuantity();
          if (this.newPostsQuantity > 0) {
              this._newPostsEl.innerHTML = '';
              this.drawNewPostsButton();

          } else if (this.newPostsQuantity === 0) {
              this._newPostsEl.innerHTML = '';
          }
       this.pollNewPosts();
     }, 2000);
   }

  showError(error) {
    const data = JSON.parse(error);
    const message = this._context.translate(data.message);
    this._errorMessageEl.textContent = message;
    this._errorModal.modal('show');
  }

  destroy() {
    clearTimeout(this._timeout);
  }
}
