import React, { Component } from "react";
import { Container, Row, Col } from "shards-react";
import ReactExport from "react-data-export";
import swal from "sweetalert";
import Paper from "../common/Paper";
import Counter from "../common/Counter";
import Input from "../common/InputFullWidth";
import PageTitle from "../common/PageTitle";
import Button from "../common/Button";
import Upload from "../common/UploadButton";
import Table from "../common/Table";
import Dialog from "../common/Dialog";
import { LoginConsumer } from "../../config/contextConfig.js";
import { sendRequest, getRequests } from "../../config/firebase";
import { getAccountAddress, getTokenBalance } from "../../utils/blockchainFunctions";
import * as firebase from "firebase";
import excelToJson from 'convert-excel-to-json';
import weHealthController from "../../interface/weHealthController";
import web3 from "../../interface/web3";
import ExcelReader from './ExcelReader'
//for blockchain

let firstTime = true;
export default class RequestData extends Component {
  constructor() {
    super();
    this.state = {
      viewport: {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight
      },
      open: false,
      gotContext: true,
      description: "",
      accept: false,
      toSendUid: "",
      toSendData: "",
      address: "",
      count: 1
    };
    this.upload = React.createRef();
  }
  async componentDidMount() {
    try {
      const address = await getAccountAddress();
      console.log(address);
      this.setState({ address });
    } catch (e) {
      console.log(e);
    }

    window.addEventListener("resize", this._resize_mixin_callback);
    firebase
      .database()
      .ref("requests")
      .on("value", data => {
        let userData = data.val();
        let requests = [];
        let uid = sessionStorage.getItem('uid')
        for (let key in userData) {
          if(key!==uid){
            for (let key1 in userData[key]) {
              requests.push(userData[key][key1]);
            }
          }
        }
        this.setState({ data: requests });
      });
  }

  // gotRequests = async () => {
  //     try {
  //         getRequests().then(res => {
  //             console.log(res)
  //         })
  //         // const data = await getRequests()
  //         // this.setState({ data })
  //         // console.log(data)
  //         // return data;
  //     }
  //     catch (e) {
  //         console.log(e.message)
  //     }
  // }

  handleChange = e => {
    const { name, value } = e.target;
    this.setState({
      [name]: value
    });
  };

  handleOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false, accept: false });
  };

  buyDataForTokens = async (tokens) => {
    try {
      const accounts = await web3.eth.getAccounts();
      this.setState({
        address: accounts[0]
      })
      await weHealthController.methods
        .requestData(tokens)
        .send({
          from: accounts[0]
        }).on('transactionHash', (hash) => {
          console.log(hash);
          this.setState({ transactionHash: 'https://rinkeby.etherscan.io/tx/' + hash })
        }).on('confirmation', function () {
        })
    } catch (e) {
      console.log(e);
    }
  };

  onRequest = () => {
    getTokenBalance()
      .then(tokens => {
        if (this.state.count * 100 <= tokens) {
          this.buyDataForTokens(this.state.count * 100)
          sendRequest(
            sessionStorage.getItem('uid'),
            this.state.description,
            this.state.count,
            this.state.address
          );
          this.setState({ description: "", count: 1, open: false });
        } else {
          swal({
            title: "Transaction unsuccessful",
            text: "You donot have sufficient tokens to perform this transaction.",
            icon: "warning",
            dangerMode: true,
          })
        }
      })
  };

  increaseCount = () => {
    this.setState(prevState => ({
      count: prevState.count + 1
    }));
  };

  decreaseCount = () => {
    this.state.count !== 1
      ? this.setState(prevState => ({ count: prevState.count - 1 }))
      : console.log("Can't decrease");
  };

  mapData = () => {
    const data = this.state.data;
    let requests = [];
    for (let key in data) {
      for (let key1 in data[key]) {
        requests.push(data[key][key1]);
      }
    }
    return requests;
  };

  getTokensForData = async (address) => {
    try {
      const accounts = await web3.eth.getAccounts();
      await weHealthController.methods
        .getTokenForData(address)
        .send({
          from: accounts[0]
        }).on('transactionHash', (hash) => {
          console.log(hash);
          this.setState({ transactionHash: 'https://rinkeby.etherscan.io/tx/' + hash })
        }).on('confirmation', function () {
          if (firstTime) {
                swal({
                  icon: "success",
                  text: "Successfully Transfered"
                });
              }
        })
    } catch (e) {
      console.log(e);
    }
  };

  onFileSubmit = e => {
    e.preventDefault();
    let file = this.upload.current.files[0];
    console.log(this.upload.current.files[0]);
    // const result = excelToJson({
    //   source: fs.readFileSync(file)
    // })
    // console.log('excel to json ===>',result)
    // const reader = new FileReader();
    // reader.onload = function () {
    //   // text = reader.result;
    //   // console.log(reader.result);
    //   console.log('onsubmit ===>',reader.result)
    // };
    // console.log('reader read as text ===>',reader.readAsBinaryString(file))
    // reader.readAsText(input.files[0]);
    // firebase
    //   .storage()
    //   .ref("files/" + file.name)
    //   .put(file)
    //   .then(success => {
    //     firebase
    //       .storage()
    //       .ref("files/" + file.name)
    //       .getDownloadURL()
    //       .then(url => {
    //         let obj = {
    //           data: this.state.toSendData,
    //           url
    //         };
            // firebase
            //   .database()
            //   .ref("Accepts")
            //   .child(this.state.toSendUid)
            //   .push(obj)
            //   .then(() => {
            //     this.getTokensForData(this.state.address)
            //     .then(res => {
            //       this.setState({ open: false });
            //       swal({
            //         icon: "success",
            //         text: "File Successfully Uploaded!"
            //       });
            //     })
            //   })
            //   .catch(e => {
            //     swal({
            //       icon: "warning",
            //       text: e.message
            //     });
    //           });
    //       });
    //   });
  };



  openModal = ({ uid, data, address }) => {
    this.handleOpen();
    this.setState({ accept: true, toSendUid: uid, toSendData: data, address : address });
  };

  _resize_mixin_callback = () => {
    this.setState({
      viewport: {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight
      }
    });
  };

  componentWillUnmount() {
    window.removeEventListener("resize", this._resize_mixin_callback);
  }

  render() {
    return (
      <>
        <Dialog
          viewport={this.state.viewport}
          open={this.state.open}
          handleClose={this.handleClose}
        >
          <Container>
            <Row>
              <Col>
                {!this.state.accept ? (
                  <>
                    {" "}
                    <h6>Enter to Request Data</h6>
                    <Input
                      label="Description"
                      name="description"
                      onChange={this.handleChange}
                      value={this.state.description}
                    />
                    <Counter
                      count={this.state.count}
                      increaseCount={this.increaseCount}
                      decreaseCount={this.decreaseCount}
                    />
                    <Button text="Submit Request" onClick={this.onRequest} />{" "}
                  </>
                ) : (
                    <>
                      <h6>Enter File to Send</h6>
                      <ExcelReader handleClose={this.handleClose} getTokensForData={this.getTokensForData} address={this.state.address} toSendUid={this.state.toSendUid} />
                    </>
                  )}
              </Col>
            </Row>
          </Container>
        </Dialog>

        <LoginConsumer>
          {({ uid }) => {
            if (this.state.gotContext) {
              this.setState({ uid, gotContext: false });
            }
          }}
        </LoginConsumer>

        <Container fluid className="main-content-container px-4 pb-4">
          <Row noGutters className="page-header py-4">
            <PageTitle
              title="REQUEST"
              subtitle="Component"
              className="text-sm-left mb-3"
            />
          </Row>
          <Row>
            <Col lg={12}>
              <Row>
                <Col lg={8}>
                  <Paper>
                    <Col>
                      <h5>Requests</h5>
                      {this.state.data ? (
                        <Table
                          data={this.state.data}
                          buttonText="accept"
                          onClick={this.openModal}
                        />
                      ) : (
                          ""
                        )}
                    </Col>
                  </Paper>
                </Col>
                <Col>
                  <Paper>
                    <Col>
                      <h5>Ask for Data</h5>
                      <Button text="Request" onClick={this.handleOpen} />
                    </Col>
                  </Paper>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </>
    );
  }
}
