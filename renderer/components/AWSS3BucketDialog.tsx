import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import { useForm } from "react-hook-form";
import { BucketInfo, RegionInfoList } from "../types";

interface AWSS3BucketDialogProps {
  show: boolean;
  bucket: BucketInfo;
  onSave: (bucket: BucketInfo) => Promise<void>;
  onCancel: () => Promise<void>;
}
export const AWSS3BucketDialog = (props: AWSS3BucketDialogProps) => {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const handleOK = async (data) => {
    setSaving(true);
    await props?.onSave(data);
    setSaving(false);
  };
  const handleCancel = async () => {
    await props?.onCancel();
  };
  useEffect(() => {
    if (!props.bucket) {
      reset({
        name: "",
        region: "",
      });
    } else {
      reset({
        name: props.bucket.name,
        region: props.bucket.region,
      });
    }
  }, [props.bucket, props.show, reset]);

  return (
    <Dialog maxWidth={"md"} fullWidth={true} open={props.show}>
      <form onSubmit={handleSubmit(handleOK)} noValidate>
        {props?.bucket && <DialogTitle>Edit Bucket</DialogTitle>}
        {!props?.bucket && <DialogTitle>Create Bucket</DialogTitle>}
        <DialogContent>
          <Typography>
            Specify bucket name and optional parameters and click Save
          </Typography>
          <TextField
            autoFocus
            required
            margin="dense"
            id="name"
            name="name"
            label="Bucket name"
            defaultValue={props?.bucket?.name}
            type="string"
            fullWidth
            variant="standard"
            error={errors.name != null}
            {...register("name", { required: true })}
          />
          <FormControl variant="standard" sx={{ marginTop: 1, minWidth: 300 }}>
            <InputLabel id="region-label">Region</InputLabel>
            <Select
              labelId="region-label"
              id="region"
              name="region"
              defaultValue={props?.bucket?.region}
              {...register("region")}
            >
              {RegionInfoList &&
                RegionInfoList.map((item, index) => (
                  <MenuItem key={index} value={item}>
                    {item}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button type="submit">Save</Button>
          <Button autoFocus onClick={handleCancel}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
