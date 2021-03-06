import React, { Component } from 'react';
import XLSX from 'xlsx';
import { make_cols } from './MakeColumns';
import { SheetJSFT } from './types';
import Button from "../common/Button";
import swal from "sweetalert";
import * as firebase from "firebase";

class ExcelReader extends Component {
    constructor(props) {
        super(props);
        this.state = {
            file: {},
            data: [],
            cols: []
        }
        this.handleFile = this.handleFile.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e) {
        const files = e.target.files;
        if (files && files[0]) this.setState({ file: files[0] });
    };

    handleFile() {
        /* Boilerplate to set up FileReader */
        const reader = new FileReader();
        const rABS = !!reader.readAsBinaryString;
        let data
        reader.onload = (e) => {
            /* Parse data */
            const bstr = e.target.result;
            const wb = XLSX.read(bstr, { type: rABS ? 'binary' : 'array', bookVBA: true });
            /* Get first worksheet */
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            /* Convert array of arrays */
            data = XLSX.utils.sheet_to_json(ws);
            /* Update state */
            this.setState({ data: data, cols: make_cols(ws['!ref']) }, () => {
                console.log(JSON.stringify(this.state.data, null, 2));
            });
            console.log('state data ===>', JSON.stringify(this.state.data, null, 2))
            this.sendData(data)
        };

        if (rABS) {
            reader.readAsBinaryString(this.state.file);
        } else {
            reader.readAsArrayBuffer(this.state.file);
        };

    }

    sendData = async (data) => {
        // console.log('this.props.toSendUid ===>', this.props.toSendUid)
        // console.log('this.state.data.data ===>', data)
        // const myData = {...data}
        // console.log('myData ===>', myData)
        let result = [];
        for (let key in data) {
            for (let key1 in data[key]) {
                result.push((data[key][key1]).toString())
            }
        }
        // console.log('result ===>',result)
        await firebase.database().ref("Accepts").child(this.props.toSendUid).push(result)
            .then(() => {
                this.props.getTokensForData(this.props.address)
                    .then(res => {
                        this.props.handleClose()
                        swal({
                            icon: "success",
                            text: "File Successfully Uploaded!"
                        })
                            .catch(e => {
                                swal({
                                    icon: "warning",
                                    text: e.message
                                });
                            })
                    })
            })
            .catch(e => {
                swal({
                    icon: "warning",
                    text: e.message
                });
            })
    }

    render() {
        return (
            <div>
                <input type="file" className="form-control" id="file" accept={SheetJSFT} onChange={this.handleChange} />
                <Button text="Confirm"
                    buttonType="submit"
                    onClick={this.handleFile} />
            </div>

        )
    }
}

export default ExcelReader;